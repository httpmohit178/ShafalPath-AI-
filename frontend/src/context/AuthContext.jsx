import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { localInterviewReply } from '../lib/localInterview';
import { localDsaRecommendations } from '../lib/localDsa';
import { makeLocalChallenge } from '../lib/localChallenges';

const AuthContext = createContext();
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

const getDemoUser = () => JSON.parse(localStorage.getItem('safalpath_demo_user') || 'null');
const touchDemoStreak = (user) => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(`${today}T00:00:00.000Z`); yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  const streak = { current: 0, best: 0, ...(user.streak || {}) };
  if (streak.lastActiveDate !== today) {
    streak.current = streak.lastActiveDate === yesterday ? streak.current + 1 : 1;
    streak.best = Math.max(streak.best, streak.current);
    streak.lastActiveDate = today;
  }
  return { ...user, streak };
};
const saveDemoUser = (updates = {}) => {
  const next = touchDemoStreak({ ...(getDemoUser() || {}), ...updates, demoMode: true });
  localStorage.setItem('safalpath_demo_user', JSON.stringify(next));
  return next;
};
const getDemoLevel = (xp = getDemoUser()?.xp || 0) => {
  const level = Math.floor(xp / 50) + 1;
  const titles = ['Fresher', 'Learner', 'Builder', 'Contender', 'Placement Ready'];
  return { level, title: titles[Math.min(level - 1, titles.length - 1)], progressPercent: (xp % 50) * 2, xpToNext: 50 - (xp % 50) };
};
const demoWeekKey = () => { const date = new Date(); date.setUTCHours(0, 0, 0, 0); date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7)); return date.toISOString().slice(0, 10); };
const completeDemoWeekly = (id) => {
  const user = getDemoUser() || {}; const weekKey = demoWeekKey(); const completed = user.weeklyChallenges?.weekKey === weekKey ? (user.weeklyChallenges.completed || []) : [];
  if (completed.includes(id)) return user;
  return saveDemoUser({ xp: (user.xp || 40) + 60, weeklyChallenges: { weekKey, completed: [...completed, id] }, activityLog: [{ date: new Date().toISOString().slice(0, 10), title: `Weekly challenge completed: ${id}`, score: 60 }, ...(user.activityLog || [])] });
};
const getFormValue = (form, key) => form instanceof FormData ? form.get(key) : form?.[key];
const runJavascriptLocally = (code, expectedOutput) => new Promise((resolve) => {
  if (typeof Worker === 'undefined') return resolve({ stdout: '', stderr: 'Browser code runner is unavailable. Start the backend for code execution.', exitCode: 1, aiReview: 'AI code coaching is available when GROQ_API_KEY is configured.' });
  const workerSource = `self.onmessage = ({ data }) => { const lines = []; console.log = (...values) => lines.push(values.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(' ')); try { (new Function(data.code))(); const stdout = lines.join('\\n'); const last = stdout.trim().split(/\\r?\\n/).filter(Boolean).at(-1) || ''; self.postMessage({ stdout, stderr: '', exitCode: 0, passedTest: data.expectedOutput == null ? null : last === String(data.expectedOutput).trim() }); } catch (error) { self.postMessage({ stdout: lines.join('\\n'), stderr: error?.stack || String(error), exitCode: 1, passedTest: false }); } };`;
  const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
  const worker = new Worker(blobUrl); let finished = false;
  const finish = (result) => { if (finished) return; finished = true; clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(blobUrl); resolve({ ...result, aiReview: 'Connect the backend and add GROQ_API_KEY for AI complexity coaching.' }); };
  const timer = setTimeout(() => finish({ stdout: '', stderr: 'Execution timed out after 2 seconds.', exitCode: 1 }), 2000);
  worker.onmessage = ({ data }) => finish(data); worker.onerror = (error) => finish({ stdout: '', stderr: error.message || 'Code execution failed.', exitCode: 1, passedTest: false }); worker.postMessage({ code, expectedOutput });
});

// Store-backed starter mode keeps the product usable before a MongoDB/API is configured.
API.interceptors.response.use((r) => r, (error) => {
  const url = error.config?.url || '';
  const localFallback = !error.response || error.response.status === 404 || error.response.status >= 500;
  let body = {};
  try { if (typeof error.config?.data === 'string') body = JSON.parse(error.config.data); } catch { body = {}; }
  const local = getDemoUser();
  const ok = (data) => Promise.resolve({ data, status: 200, config: error.config });
  if (localFallback && url.includes('/ai/interview')) {
    if (body.timedOut && !String(body.userAnswer || '').trim()) return ok({ score: 1, feedback: 'The five-minute response window ended before an answer was submitted. Use the next question to practise a concise response.', nextQuestion: localInterviewReply({ ...body, userAnswer: null, resumeText: local?.resumeText || '' }).nextQuestion, mode: 'local' });
    return ok(localInterviewReply({ ...body, resumeText: local?.resumeText || '' }));
  }
  if (localFallback && url.includes('/ai/chat')) return ok({ reply: 'I’m here to help you prepare. Start with one focused goal today: practice a DSA pattern, sharpen one resume bullet, or rehearse a project story. Which would you like to tackle?' });
  if (localFallback && url.includes('/ai/roadmap')) {
    const count = Math.min(12, Math.max(2, Number(body.weeks) || 6));
    const plan = Array.from({ length: count }, (_, i) => ({ week: i + 1, title: ['Build your foundations', 'Practice core patterns', 'Strengthen problem solving', 'Create and refine projects'][i % 4], subtitle: `${body.hoursPerDay || 3} focused hours a day`, tasks: [{ title: ['Review JavaScript fundamentals', 'Solve two array problems', 'Practice a behavioral story'][i % 3], type: 'Practice', hours: '45 min', resource: 'Guided practice', completed: false }, { title: ['Study data structures', 'Review a project decision', 'Work through a tree problem'][i % 3], type: 'Study', hours: '60 min', resource: 'Your learning plan', completed: false }] }));
    const user = { ...(local || {}), roadmap: { weeks: count, hoursPerDay: body.hoursPerDay || 3, plan }, demoMode: true }; localStorage.setItem('safalpath_demo_user', JSON.stringify(user)); return ok({ user, levelInfo: getDemoLevel(user.xp) });
  }
  if (localFallback && url.includes('/ai/match-jd')) {
    const jd = String(body.jobDescription || '').toLowerCase(); const resume = String(local?.resumeText || '').toLowerCase(); const keywords = [...new Set((jd.match(/[a-z+#.]{3,}/g) || []).filter((word) => !['the', 'and', 'with', 'for', 'you', 'are', 'our', 'will', 'have', 'that', 'this', 'from', 'work', 'role'].includes(word)))].slice(0, 16); const matchedSkills = keywords.filter((word) => resume.includes(word)); const missingKeywords = keywords.filter((word) => !resume.includes(word)).slice(0, 8);
    const matchPercent = keywords.length ? Math.round((matchedSkills.length / keywords.length) * 100) : 0;
    const jobMatches = [...(local?.jobMatches || []), { company: body.company || 'Job description', score: matchPercent, date: new Date().toISOString().slice(0, 10) }];
    const badges = [...new Set([...(local?.badges || []), ...(jobMatches.length >= 3 ? ['Job Hunter'] : [])])]; const next = saveDemoUser({ jobMatches, badges });
    return ok({ matchPercent, matchedSkills, missingKeywords, strengths: matchedSkills.length ? [`Your resume mentions ${matchedSkills.slice(0, 4).join(', ')}.`] : ['Add a resume to compare your experience with this role.'], recommendations: ['Add only skills you can support with a project or experience example.'], user: next, levelInfo: getDemoLevel(next.xp) });
  }
  if (localFallback && url.includes('/ai/dsa-recommend')) return ok(localDsaRecommendations(body.topics || ['Arrays', 'Graphs'], body.company || 'Daily mix'));
  if (localFallback && url.includes('/user/leaderboard')) return ok([{ ...(local || { _id: 'demo-user', name: 'You', xp: 120, streak: { current: 4 } }) }]);
  if (localFallback && url.includes('/ai/coding-challenge')) return ok(makeLocalChallenge(body.previousTitles || [], body.difficulty || 'Easy', body.topic || 'Random topic'));
  if (localFallback && url.includes('/ai/run-code')) {
    if (body.language !== 'javascript') {
      if (error.response) return Promise.reject(error);
      return ok({ stdout: '', stderr: 'The backend code runner is unreachable. Set VITE_API_URL to your deployed backend and confirm that backend has CODE_RUNNER_API_KEY configured.', exitCode: 1, aiReview: '' });
    }
    return runJavascriptLocally(body.code || '', body.expectedOutput).then((data) => ({ data, status: 200, config: error.config }));
  }
  if (localFallback && url.includes('/ai/analyze-resume')) {
    const form = error.config?.data; const resumeText = getFormValue(form, 'resumeText') || '';
    if (!resumeText.trim()) return Promise.reject({ response: { data: { error: 'Paste your resume text for local preview analysis. PDF text extraction needs the backend.' } } });
    const knownSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Python', 'Java', 'C++', 'AWS', 'Docker', 'Git', 'REST API', 'Communication'];
    const skills = knownSkills.filter((skill) => resumeText.toLowerCase().includes(skill.toLowerCase()));
    const missingSkills = ['Testing', 'Cloud deployment', 'Impact metrics'].filter((skill) => !resumeText.toLowerCase().includes(skill.toLowerCase()));
    const issues = [];
    if (!/\S+@\S+\.\S+/.test(resumeText)) issues.push({ issue: 'Contact email not found', whyItHurts: 'Recruiters need a clear way to contact you.', fix: 'Add a professional email address in your header.' });
    if (!/\b(19|20)\d{2}\b/.test(resumeText)) issues.push({ issue: 'No dates detected', whyItHurts: 'A recruiter cannot quickly understand your experience timeline.', fix: 'Add month and year for education, projects, and roles where applicable.' });
    if (!/\d+\s?%|\$\s?\d|\d+\s?(users|customers|projects|hours|days)/i.test(resumeText)) issues.push({ issue: 'Impact is hard to measure', whyItHurts: 'Bullets without outcomes make it difficult to see the result of your work.', fix: 'Add real numbers only where you can verify them.' });
    if (resumeText.length < 250) issues.push({ issue: 'Resume detail is very brief', whyItHurts: 'There may not be enough evidence to assess your experience.', fix: 'Add role, dates, responsibilities, projects, and outcomes.' });
    const target = getFormValue(form, 'targetRole') || 'Software Engineer';
    const correctedResume = resumeText.trim();
    const analysis = { atsScore: Math.max(0, Math.min(100, 70 - issues.length * 5 + Math.min(skills.length, 5) * 2)), summary: `Local text checks for ${target}: this score is a rough checklist indicator, not a prediction of hiring outcomes. The original resume text is preserved below; no AI rewrite was performed.`, skills, missingSkills, issues, correctedResume, strengths: skills.length ? [`Detected these skills in the supplied text: ${skills.join(', ')}.`] : ['Resume text was received; no skills from the local detection list were found.'], skillGaps: missingSkills.map((skill) => ({ skill, whyItMatters: `This skill may be relevant to ${target}; verify against a specific job description.`, nextStep: `Add evidence only if you have used ${skill}.` })), experienceInsights: [], improvements: [], suggestedProjects: [] };
    const badges = [...new Set([...(local?.badges || []), 'Resume Ready', ...(analysis.atsScore >= 80 ? ['ATS Ace'] : [])])];
    let next = saveDemoUser({ resumeText, resumeRewrite: correctedResume, targetRole: target, atsScore: analysis.atsScore, skills, missingSkills, badges });
    next = completeDemoWeekly('resume-refresh');
    return ok({ analysis, user: next, levelInfo: getDemoLevel(next.xp) });
  }
  if (localFallback && url.includes('/user/roadmap/toggle')) {
    const plan = [...(local?.roadmap?.plan || [])]; const week = { ...plan[body.weekIdx], tasks: [...(plan[body.weekIdx]?.tasks || [])] }; const task = { ...week.tasks[body.taskIdx] }; task.completed = !task.completed; const award = task.completed && !task.xpAwarded; if (award) task.xpAwarded = true; week.tasks[body.taskIdx] = task; plan[body.weekIdx] = week;
    const completedCount = plan.reduce((sum, item) => sum + (item.tasks || []).filter((entry) => entry.completed).length, 0); const badges = [...new Set([...(local?.badges || []), ...(completedCount >= 10 ? ['Planner'] : [])])];
    const next = saveDemoUser({ roadmap: { ...(local?.roadmap || {}), plan }, badges, xp: (local?.xp || 40) + (award ? 10 : 0) }); return ok({ user: next, levelInfo: getDemoLevel(next.xp) });
  }
  if (localFallback && url.includes('/user/dsa/solve')) {
    const already = (local?.dsaSolved || []).some((item) => item.title === body.title); const next = saveDemoUser({ dsaSolved: already ? local.dsaSolved : [...(local?.dsaSolved || []), body], xp: (local?.xp || 40) + (already ? 0 : 15), dailyQuests: { ...(local?.dailyQuests || {}), date: new Date().toISOString().slice(0, 10), dsaDone: true } }); return ok({ user: next, levelInfo: getDemoLevel(next.xp) });
  }
  if (localFallback && (url.includes('/user/interview/complete') || url.includes('/user/coding/complete'))) {
    const isInterview = url.includes('interview'); const field = isInterview ? 'interviewDone' : 'codingDone'; const today = new Date().toISOString().slice(0, 10); const quests = local?.dailyQuests?.date === today ? local.dailyQuests : { date: today, dsaDone: false, interviewDone: false, codingDone: false, assessmentDone: false }; const award = quests[field] ? 0 : (isInterview ? 40 : 40);
    if (!isInterview && body.passedTest !== true) return Promise.reject(error);
    const sessionBadges = isInterview ? ['First Interview', ...((body.score || 0) >= 80 ? ['Smooth Talker'] : [])] : ['All Green'];
    let next = saveDemoUser({ xp: (local?.xp || 40) + award, dailyQuests: { ...quests, [field]: true }, interviewHistory: isInterview ? [{ score: body.score, date: today, type: body.round }, ...(local?.interviewHistory || [])] : local?.interviewHistory, activityLog: [{ title: isInterview ? `Aria interview · ${body.role || 'Career practice'}` : `Completed coding challenge: ${body.title || ''}`, score: award, date: today }, ...(local?.activityLog || [])], badges: [...new Set([...(local?.badges || []), ...sessionBadges])] });
    next = completeDemoWeekly(isInterview ? 'aria-round' : 'arena-problem');
    return ok({ user: next, levelInfo: getDemoLevel(next.xp) });
  }
  if (localFallback && url.includes('/user/resume-draft')) { const next = saveDemoUser({ resumeDraft: body }); return ok({ user: next, levelInfo: getDemoLevel(next.xp) }); }
  if (localFallback && url.includes('/user/assessment/complete')) {
    const today = new Date().toISOString().slice(0, 10); const current = local?.dailyQuests?.date === today ? local.dailyQuests : { date: today, dsaDone: false, interviewDone: false, codingDone: false, assessmentDone: false };
    const xpAwarded = current.assessmentDone ? 0 : 25;
    let next = saveDemoUser({ dailyQuests: { ...current, assessmentDone: true }, xp: (local?.xp || 40) + xpAwarded, assessmentHistory: [{ category: body.category, score: body.score, total: body.total, warnings: body.warnings || 0, date: today }, ...(local?.assessmentHistory || [])].slice(0, 30), badges: [...new Set([...(local?.badges || []), ...(body.score >= 4 ? ['Assessment Ace'] : []), ...((body.warnings || 0) === 0 ? ['Focused Mind'] : [])])], activityLog: xpAwarded ? [{ title: `Completed ${body.category} assessment · ${body.score}/${body.total}`, score: xpAwarded, date: today }, ...(local?.activityLog || [])] : local?.activityLog });
    const beforeWeekly = next.xp; next = completeDemoWeekly('assessment-week'); return ok({ user: next, levelInfo: getDemoLevel(next.xp), xpAwarded, weeklyXpAwarded: next.xp - beforeWeekly });
  }
  if (localFallback && url.includes('/user/profile/avatar')) { const next = saveDemoUser({ avatar: body.avatar }); return ok({ user: next, levelInfo: getDemoLevel(next.xp) }); }
  if (localFallback && url.includes('/user/rewards/spin')) {
    const today = new Date().toISOString().slice(0, 10); const alreadySpun = local?.lastSpinDate === today; const reward = alreadySpun ? local.lastSpinReward : [10, 15, 20, 25, 30, 40, 50, 75][Math.floor(Math.random() * 8)]; const next = alreadySpun ? local : saveDemoUser({ xp: (local?.xp || 40) + reward, lastSpinDate: today, lastSpinReward: reward, activityLog: [{ date: today, title: 'Daily XP spin', score: reward }, ...(local?.activityLog || [])], badges: [...new Set([...(local?.badges || []), 'Lucky Spinner'])] }); return ok({ user: next, levelInfo: getDemoLevel(next.xp), reward, alreadySpun });
  }
  return Promise.reject(error);
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('safalpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ level: 1, title: 'Fresher', progressPercent: 80, xpToNext: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('safalpath_token');
    if (!token) return setLoading(false);
    API.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setLevelInfo(res.data.levelInfo);
      })
      .catch(() => {
        localStorage.removeItem('safalpath_token');
        localStorage.removeItem('safalpath_demo_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const syncUser = (updatedUser, updatedLevel) => {
    if (updatedUser) setUser(updatedUser);
    if (updatedLevel) setLevelInfo(updatedLevel);
  };

  const logout = () => {
    localStorage.removeItem('safalpath_token');
    localStorage.removeItem('safalpath_demo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, levelInfo, loading, syncUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
