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
const audioUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
const fallbackModel = process.env.GROQ_FALLBACK_MODEL || DEFAULT_GROQ_MODEL;
const codeRunnerUrl = process.env.CODE_RUNNER_URL || 'https://api.onlinecompiler.io/api/v2/piston/execute';
const generate = async (prompt, json = false) => {
  if (!process.env.GROQ_API_KEY) throw new Error('Groq is not configured. Add GROQ_API_KEY to backend/.env.');
  const requestModel = async (modelId) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: prompt }], temperature: 0.4, ...(json ? { response_format: { type: 'json_object' } } : {}) })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || `Groq request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return payload.choices?.[0]?.message?.content || '';
  };
  try { return await requestModel(model); }
  catch (err) {
    const unavailableModel = [400, 403, 404].includes(err.status) && /model|access|permission/i.test(err.message);
    if (!unavailableModel || model === fallbackModel) throw err;
    console.warn(`Groq model ${model} unavailable; retrying with ${fallbackModel}.`);
    return requestModel(fallbackModel);
  }
};
const parseJson = (text) => JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
const questionTokens = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !new Set(['aria', 'welcome', 'role', 'focus', 'tell', 'please', 'think', 'about', 'that', 'this', 'would', 'could', 'should', 'your', 'you', 'how', 'what', 'when', 'where', 'which', 'with', 'from', 'have', 'does', 'did', 'are', 'the', 'and', 'for', 'into', 'after', 'before', 'then', 'next', 'question', 'build', 'lets', 'experience']).has(word));
const repeatsQuestion = (candidate, previousQuestions) => {
  const candidateTokens = questionTokens(candidate);
  if (!candidateTokens.length) return false;
  return previousQuestions.some((previous) => {
    const previousTokens = questionTokens(previous);
    if (!previousTokens.length) return false;
    const left = new Set(candidateTokens); const right = new Set(previousTokens);
    const shared = [...left].filter((token) => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return (left.size === right.size && shared === union) || (shared >= 4 && (shared / union >= 0.58 || shared / Math.min(left.size, right.size) >= 0.8));
  });
};
const respondError = (res, err) => {
  console.error('AI request failed:', err.message);
  res.status(err.status || 502).json({ error: err.message || 'AI request failed. Check your API key and model configuration.' });
};
const localCodeReview = (language, code) => {
  const text = String(code || '');
  const loopCount = (text.match(/\b(for|while)\s*\(/g) || []).length + (text.match(/\bfor\s+\w+\s+in\b/g) || []).length;
  const nested = loopCount >= 2 && /\b(for|while)\s*\([^)]*\)[\s\S]{0,700}\b(for|while)\s*\(/.test(text);
  const hasLinearStructure = /\b(Map|Set|Array|List|vector|HashMap|dict|set)\b|\[\]/.test(text);
  const complexity = nested ? 'The code appears to contain nested loops, so check whether its time cost grows near O(n²).' : loopCount ? 'The code appears to scan data in a loop, so its time cost may be O(n).' : 'The time complexity is unclear from a quick local scan; verify it against the largest input.';
  const memory = hasLinearStructure ? 'It also appears to allocate a collection, which may use O(n) extra space.' : 'No obvious extra collection is visible, but verify the auxiliary space used by your approach.';
  const suggestion = /TODO|pass\s*$|return\s*\{\s*\}|new int\[0\]/m.test(text) ? 'The starter still contains an unimplemented placeholder; finish the solution before submitting.' : 'Try edge cases such as empty/minimum input, duplicates, and the largest allowed input.';
  return `Local code coach for ${language}: ${complexity} ${memory} ${suggestion}`;
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
    const { role = 'Software Development Engineer', round = 'Role skills & scenarios', userAnswer } = req.body;
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];
    const candidate = await User.findById(req.user.id).select('resumeText skills targetRole');
    const resumeContext = (candidate?.resumeText || '').slice(0, 9000);
    const askedQuestions = history.filter((message) => message?.sender === 'ai' && message?.questionNumber).map((message) => message.text).filter(Boolean);
    const experienceRound = /experience|projects/i.test(round);
    const roundGuidance = experienceRound
      ? 'Focus on a real work, internship, volunteer, or personal project example. You may refer to a specific resume detail, but never assume a result that is not stated.'
      : /behavioral/i.test(round)
        ? 'Ask about a workplace behavior such as teamwork, communication, conflict, feedback, ownership, or prioritization. Do not ask the candidate to describe a project.'
        : /situational/i.test(round)
          ? `Give a realistic hypothetical situation specific to the ${role} job and ask what the candidate would do. Do not ask about a project.`
          : /technical dsa|problem solving/i.test(round)
            ? `Ask a role-relevant technical or job problem-solving question for ${role}. For software roles, focus on algorithms, debugging, or reasoning; for other roles, ask a realistic work problem. Do not ask about a project.`
            : /system design|core cs/i.test(round)
              ? `Ask a core systems/design question suited to ${role}; for non-software roles ask about designing a reliable work process. Do not ask about a past project.`
              : `Ask about a specific skill, tool, method, or day-to-day task that is central to working as a ${role}. Do not ask about a project.`;
    const prompt = userAnswer
      ? `You are Aria, a warm but rigorous interviewer. Interview for role: ${role}. Interview focus: ${round}. ${roundGuidance} Score the answer fairly for this role. Candidate resume context: ${experienceRound ? (resumeContext || 'No resume uploaded; do not assume experience.') : 'Do not use the resume to turn this into a project question.'} Candidate profile skills: ${(candidate?.skills || []).join(', ')}. Conversation so far: ${JSON.stringify(history).slice(-6000)}. Latest answer: ${JSON.stringify(userAnswer)}. Return JSON with score (integer 1-10 based on relevance, clarity, evidence, and role fit), feedback (two specific sentences: one evidence-based strength and one actionable improvement), and nextQuestion (one focused, new question for this role and interview focus). Do not invent candidate experience. Do not repeat these previously asked questions: ${JSON.stringify(askedQuestions)}.`
      : `You are Aria, an encouraging but realistic interviewer. Interview for role: ${role}. Interview focus: ${round}. ${roundGuidance} Ask exactly one specific, open-ended first question appropriate to this role and focus. This may be any career, including non-technical work. ${experienceRound ? `Candidate resume context: ${resumeContext || 'No resume uploaded; ask for a real experience example without assuming one.'} Use a resume detail only if it clearly supports the question.` : 'Ignore resume project details for this question; ask about the selected role and focus instead.'} Candidate skills: ${(candidate?.skills || []).join(', ')}. Return JSON: {"nextQuestion":"...","score":null,"feedback":""}.`;
    const local = localInterviewReply({ role, round, history, userAnswer, resumeText: candidate?.resumeText });
    const generated = parseJson(await generate(prompt, true));
    const score = userAnswer && Number.isFinite(Number(generated.score)) ? Math.max(1, Math.min(10, Math.round(Number(generated.score)))) : null;
    const feedback = typeof generated.feedback === 'string' ? generated.feedback.slice(0, 1200) : '';
    const generatedQuestion = typeof generated.nextQuestion === 'string' ? generated.nextQuestion.trim() : '';
    const normalizedQuestion = generatedQuestion.toLowerCase().replace(String(role).toLowerCase(), ' ');
    const projectQuestion = /\bprojects?\b|\bportfolio\b/i.test(normalizedQuestion) || /\bwhat (?:have you built|did you build)\b/i.test(normalizedQuestion);
    const generatedIsRepeated = repeatsQuestion(generatedQuestion, askedQuestions);
    const localIsRepeated = repeatsQuestion(local.nextQuestion, askedQuestions);
    const nextQuestion = generatedQuestion && !generatedIsRepeated && (!projectQuestion || experienceRound)
      ? generatedQuestion.slice(0, 1200)
      : localIsRepeated ? 'Please share one different example or approach you have not mentioned yet. What did you do, and what was the result?' : local.nextQuestion;
    res.json({ ...local, ...generated, score, feedback, nextQuestion, mode: 'groq' });
  } catch (err) {
    const { role = 'Software Development Engineer', round = 'Role skills & scenarios', userAnswer } = req.body;
    const history = Array.isArray(req.body.history) ? req.body.history.slice(-12) : [];
    const candidate = await User.findById(req.user.id).select('resumeText').catch(() => null);
    res.json({ ...localInterviewReply({ role, round, history, userAnswer, resumeText: candidate?.resumeText }), mode: 'local' });
  }
});

router.post('/transcribe', auth, audioUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Record an answer before asking Aria to transcribe it.' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'Groq transcription is not configured on the backend. Add GROQ_API_KEY to the deployed backend environment and restart it, or use browser dictation below.' });
    if (!/^audio\/(webm|mp4|ogg|mpeg|wav|x-wav|flac)/i.test(req.file.mimetype)) return res.status(415).json({ error: 'Unsupported audio format. Use WebM, MP4, OGG, WAV, or FLAC audio.' });
    const form = new FormData();
    form.append('model', process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo');
    form.append('language', req.body.language || 'en');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    form.append('prompt', 'Transcribe the candidate speaking in a job interview. Preserve technical terms, programming languages, company names, and numbers. Return only the spoken words.');
    form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || 'interview-answer.webm');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || `Transcription request failed (${response.status}).`);
    const transcript = String(payload.text || '').trim();
    if (!transcript) return res.status(422).json({ error: 'Aria could not hear clear speech. Try again closer to the microphone or type your answer.' });
    res.json({ transcript, mode: 'groq-transcription', model: process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo' });
  } catch (err) {
    console.error('Audio transcription failed:', err.message);
    res.status(err.status || 502).json({ error: 'Aria could not transcribe this recording. Try browser dictation or type your answer.' });
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
    const challenge = parseJson(await generate(`Create one original LeetCode-style interview coding challenge. Topic: ${topic}. Difficulty: ${difficulty}. Return valid JSON with fields: title (short), difficulty (Easy|Medium|Hard), topic, acceptance (N/A), statement, examples (array of input/output with explanation), constraints (array), hint, expectedOutput (exact output of the included sample harness, no explanation), and starterCode object with runnable JavaScript, Python, C++, and Java strings. Each starter must define a clearly named solution function/method with TODO body, include a small sample invocation, and print the result. Keep the same sample input and exact expected output in all four starter programs. Ensure imports, types, method signatures, and print formatting compile in the selected runtime. Do not include a solution.`, true));
    res.json(challenge);
  } catch (err) { respondError(res, err); }
});

router.post('/run-code', auth, async (req, res) => {
  try {
    const { language, code, stdin = '', problemTitle = 'Custom Sandbox', expectedOutput } = req.body;
    const runtimes = { javascript: ['javascript', '18.15.0'], python: ['python', '3.10.0'], cpp: ['c++', '10.2.0'], java: ['java', '15.0.2'] };
    if (!runtimes[language]) return res.status(400).json({ error: 'Choose a supported language.' });
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ error: 'Enter some code before running the program.' });
    if (!process.env.CODE_RUNNER_API_KEY) return res.status(503).json({ error: 'The remote compiler is not configured. Add CODE_RUNNER_API_KEY to the backend environment and restart the backend.' });
    const [runtime, version] = runtimes[language];
    const execRes = await fetch(codeRunnerUrl, { method: 'POST', headers: { Authorization: process.env.CODE_RUNNER_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ language: runtime, version, files: [{ content: code }], stdin }) });
    const execData = await execRes.json().catch(() => ({}));
    if (!execRes.ok) return res.status(execRes.status === 401 || execRes.status === 403 ? 503 : 502).json({ error: execData.message || execData.error || `Code runner returned ${execRes.status}. Check CODE_RUNNER_API_KEY and runner status.` });
    let aiReview = localCodeReview(language, code);
    if (process.env.GROQ_API_KEY) {
      try { aiReview = await generate(`Review this ${language} solution for ${problemTitle}:\n${code}\nGive time complexity, space complexity, and one useful improvement.`); }
      catch (err) { console.warn('Groq code coach unavailable; returning local review:', err.message); }
    }
    const stdout = execData.run?.stdout || '';
    const lastOutput = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) || '';
    res.json({ stdout, stderr: execData.run?.stderr || execData.compile?.stderr || '', exitCode: execData.run?.code ?? execData.compile?.code, passedTest: expectedOutput == null ? null : lastOutput === String(expectedOutput).trim(), aiReview });
  } catch (err) { respondError(res, err); }
});

module.exports = router;
