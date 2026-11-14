const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { completeWeeklyChallenge } = require('../utils/weeklyChallenge');
const { localInterviewReply, localMentorReply } = require('../utils/localAi');
const { auditResume, localResumeAnalysis } = require('../utils/resumeReview');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const generate = async (prompt, json = false) => {
  if (!process.env.GROQ_API_KEY) throw new Error('Groq is not configured. Add GROQ_API_KEY to backend/.env.');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4, ...(json ? { response_format: { type: 'json_object' } } : {}) })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `Groq request failed (${response.status}).`);
  return payload.choices?.[0]?.message?.content || '';
};
const parseJson = (text) => JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
const respondError = (res, err) => {
  console.error('AI request failed:', err.message);
  res.status(err.status || 502).json({ error: err.message || 'AI request failed. Check your API key and model configuration.' });
};

router.post('/chat', auth, async (req, res) => {
  try {
    const u = await User.findById(req.user.id);
    const reply = await generate(`You are Margdarshak, a practical placement mentor. Student: ${u?.name || 'Candidate'}, target role: ${u?.targetRole || 'SDE'}, XP: ${u?.xp || 0}. Answer clearly and concisely. Question: ${req.body.message || ''}`);
    res.json({ reply, mode: 'groq' });
  } catch (err) { res.json({ reply: localMentorReply(req.body.message), mode: 'local' }); }
});

router.post('/interview', auth, async (req, res) => {
  try {
    const { role = 'Software Development Engineer', round = 'Technical DSA & Problem Solving', history = [], userAnswer } = req.body;
    const candidate = await User.findById(req.user.id).select('resumeText skills targetRole');
    const resumeContext = (candidate?.resumeText || '').slice(0, 9000);
    const prompt = userAnswer
      ? `You are Aria, a warm but rigorous interviewer for the ${role} role, interview focus ${round}. This may be a technical or non-technical role; ask realistic role-relevant questions and score fairly. Candidate resume context: ${resumeContext || 'No resume uploaded yet; use the selected role and conversation only.'} Candidate profile skills: ${(candidate?.skills || []).join(', ')}. Review conversation: ${JSON.stringify(history).slice(-6000)}. Latest answer: ${JSON.stringify(userAnswer)}. Return JSON with score (integer 1-10 based on relevance, clarity, evidence, and role fit), feedback (two specific sentences: one strength and one actionable improvement), and nextQuestion (one role-specific follow-up; use resume details when relevant). Do not invent candidate experience.`
      : `You are Aria, an encouraging interviewer for the ${role} role, interview focus ${round}. Candidate resume context: ${resumeContext || 'No resume uploaded yet; begin with role-specific experience questions.'} Candidate skills: ${(candidate?.skills || []).join(', ')}. Ask a first question grounded in the resume if possible; otherwise ask a specific question appropriate for this role. Support non-technical careers too. Return JSON: {"nextQuestion":"...","score":null,"feedback":""}.`;
    res.json({ ...localInterviewReply({ role, round, userAnswer, resumeText: candidate?.resumeText }), ...parseJson(await generate(prompt, true)), mode: 'groq' });
  } catch (err) {
    const { role = 'Software Development Engineer', round = 'Experience & projects', history = [], userAnswer } = req.body;
    const candidate = await User.findById(req.user.id).select('resumeText').catch(() => null);
    res.json({ ...localInterviewReply({ role, round, userAnswer, resumeText: candidate?.resumeText }), mode: 'local' });
  }
});

router.post('/analyze-resume', auth, upload.single('resumePdf'), async (req, res) => {
  try {
    let resumeText = req.body.resumeText || '';
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') resumeText = (await pdfParse(req.file.buffer)).text;
      else resumeText = req.file.buffer.toString('utf8');
    }
    resumeText = resumeText.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim();
    if (!resumeText.trim()) return res.status(400).json({ error: 'Upload a text-based PDF or paste your resume text first.' });
    if (req.file?.mimetype === 'application/pdf' && resumeText.replace(/\s/g, '').length < 40) return res.status(422).json({ error: 'This PDF has little or no selectable text. It may be scanned or image-only; run OCR first or paste the resume text.' });
    const targetRole = req.body.targetRole || 'Software Engineer';
    let analysis;
    let aiMode = 'groq';
    try {
      analysis = parseJson(await generate(`Perform a careful, role-specific resume audit for ${targetRole}. Examine every section and bullet. Check contact details, links, spelling and grammar, inconsistent formatting, missing section headings, vague claims, first-person language, weak action verbs, unexplained gaps or dates, duplicated content, ATS readability, missing outcomes, unsupported claims and role-specific keywords. Return JSON fields: atsScore (integer 0-100), summary (2-3 sentences), skills (only skills present), missingSkills (role-relevant skills absent), strengths (evidence from the text), issues (objects {issue, whyItHurts, fix}; report every issue you can substantiate), skillGaps (objects {skill, whyItMatters, nextStep}), experienceInsights (array), improvements (specific edits), suggestedProjects (array), correctedResume (complete job-application-ready plain-text rewrite with Contact, Summary, Skills, Experience, Projects and Education sections; preserve every fact, never invent employers, education, dates, skills, results or metrics; put uncertain or absent details in clear [Add ...] placeholders). Return only valid JSON. Resume text: ${resumeText.slice(0, 18000)}`, true));
    } catch {
      analysis = localResumeAnalysis(resumeText, targetRole);
      aiMode = 'local';
    }
    const auditIssues = auditResume(resumeText, targetRole);
    const existingIssues = Array.isArray(analysis.issues) ? analysis.issues : [];
    const issueKeys = new Set(existingIssues.map((item) => String(item.issue || '').toLowerCase()));
    analysis.issues = [...existingIssues, ...auditIssues.filter((item) => !issueKeys.has(item.issue.toLowerCase()))];
    analysis.atsScore = Math.max(0, Math.min(100, Number(analysis.atsScore) || 0));
    if (!analysis.correctedResume) analysis.correctedResume = localResumeAnalysis(resumeText, targetRole).correctedResume;
    const user = await User.findById(req.user.id);
    user.resumeText = resumeText.slice(0, 20000); user.resumeRewrite = analysis.correctedResume || ''; user.targetRole = targetRole; user.atsScore = analysis.atsScore; user.skills = analysis.skills || []; user.missingSkills = analysis.missingSkills || [];
    if (!user.badges.includes('Resume Ready')) user.badges.push('Resume Ready');
    if (analysis.atsScore >= 80 && !user.badges.includes('ATS Ace')) user.badges.push('ATS Ace');
    completeWeeklyChallenge(user, 'resume-refresh');
    await user.save();
    res.json({ analysis, user, levelInfo: user.getLevelInfo(), aiMode });
  } catch (err) { respondError(res, err); }
});

router.post('/roadmap', auth, async (req, res) => {
  try {
    const weeks = Math.min(12, Math.max(2, Number(req.body.weeks) || 6));
    const hoursPerDay = Math.min(8, Math.max(1, Number(req.body.hoursPerDay) || 3));
    const user = await User.findById(req.user.id);
    const prompt = `Create a practical ${weeks}-week placement study plan for ${req.body.targetRole || user.targetRole}. Candidate skill gaps: ${(user.missingSkills || []).join(', ') || 'general interview readiness'}. ${hoursPerDay} hours/day. Return JSON {"plan":[...]} with exactly ${weeks} week objects: {"week":1,"title":"...","subtitle":"...","tasks":[{ "title":"...","type":"Study|Practice|Project","hours":"45 min","resource":"specific activity","completed":false }]} and 3-4 realistic tasks per week.`;
    const { plan } = parseJson(await generate(prompt, true));
    user.targetRole = req.body.targetRole || user.targetRole; user.roadmap = { weeks, hoursPerDay, plan };
    await user.save(); res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) { respondError(res, err); }
});

router.post('/match-jd', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!req.body.jobDescription?.trim()) return res.status(400).json({ error: 'Paste a job description first.' });
    if (!user?.resumeText) return res.status(400).json({ error: 'Analyze or add your resume before matching it to a role.' });
    const result = parseJson(await generate(`Compare resume to this job description ${req.body.company || ''}. Return JSON {"matchPercent":0,"matchedSkills":[],"missingKeywords":[],"strengths":[],"recommendations":[]} with evidence-based comparison. Resume: ${(user.resumeText || '').slice(0, 12000)} Job: ${(req.body.jobDescription || '').slice(0, 12000)}`, true));
    user.jobMatches.unshift({ company: req.body.company || 'Job description', score: result.matchPercent || 0, date: new Date().toISOString().slice(0, 10) });
    if (user.jobMatches.length >= 3 && !user.badges.includes('Job Hunter')) user.badges.push('Job Hunter');
    await user.save();
    res.json({ ...result, user, levelInfo: user.getLevelInfo() });
  } catch (err) { respondError(res, err); }
});

router.post('/dsa-recommend', auth, async (req, res) => {
  try {
    const topics = (req.body.topics || ['Arrays', 'Graphs']).slice(0, 6);
    const company = req.body.company || 'General interview practice';
    const text = await generate(`Recommend exactly 2 real LeetCode problems per topic for ${topics.join(', ')}. Target company interview style: ${company}. Use commonly reported interview patterns for this company, but do not claim the company authored or endorsed these questions. Return JSON {"problems":[{"title":"exact LeetCode title","topic":"...","company":"${company}","difficulty":"Easy|Medium|Hard","summary":"pattern and learning objective","description":"A concise problem statement with the goal and key constraint, without copying the full LeetCode prompt","leetcodeUrl":"direct problem URL"}]}.` , true);
    res.json(parseJson(text).problems || []);
  } catch (err) { respondError(res, err); }
});

router.post('/coding-challenge', auth, async (req, res) => {
  try {
    const { topic = 'Arrays', difficulty = 'Easy' } = req.body;
    const challenge = parseJson(await generate(`Create one original interview coding challenge with the clarity and structure of LeetCode. Topic: ${topic}. Difficulty: ${difficulty}. Return JSON {"title":"short title","difficulty":"Easy|Medium|Hard","topic":"...","acceptance":"N/A","statement":"...","examples":["input → output with explanation"],"constraints":["..."],"hint":"...","expectedOutput":"the exact output of the starter code sample, no explanation","starterCode":"JavaScript function skeleton with a console.log call using sample input"}. Make the example runnable and ensure the starter's sample input result matches expectedOutput exactly. Do not include a solution.`, true));
    res.json(challenge);
  } catch (err) { respondError(res, err); }
});

router.post('/run-code', auth, async (req, res) => {
  try {
    const { language, code, stdin = '', problemTitle = 'Custom Sandbox', expectedOutput } = req.body;
    const runtimes = { javascript: ['javascript', '18.15.0'], python: ['python', '3.10.0'], cpp: ['c++', '10.2.0'], java: ['java', '15.0.2'] };
    if (!runtimes[language]) return res.status(400).json({ error: 'Choose a supported language.' });
    const [runtime, version] = runtimes[language];
    const execRes = await fetch('https://emkc.org/api/v2/piston/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: runtime, version, files: [{ content: code }], stdin }) });
    if (!execRes.ok) throw new Error(`Code runner returned ${execRes.status}. Try again shortly.`);
    const execData = await execRes.json();
    let aiReview = 'Local code execution is ready. Add GROQ_API_KEY to backend/.env for AI complexity coaching.';
    if (process.env.GROQ_API_KEY) {
      try { aiReview = await generate(`Review this ${language} solution for ${problemTitle}:\n${code}\nGive time complexity, space complexity, and one useful improvement.`); }
      catch (err) { aiReview = `Code ran successfully; AI review unavailable: ${err.message}`; }
    }
    const stdout = execData.run?.stdout || '';
    const lastOutput = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) || '';
    res.json({ stdout, stderr: execData.run?.stderr || execData.compile?.stderr || '', exitCode: execData.run?.code ?? execData.compile?.code, passedTest: expectedOutput == null ? null : lastOutput === String(expectedOutput).trim(), aiReview });
  } catch (err) { respondError(res, err); }
});

module.exports = router;
