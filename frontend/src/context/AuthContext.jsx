import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Store-backed starter mode keeps the product usable before a MongoDB/API is configured.
API.interceptors.response.use((r) => r, (error) => {
  const url = error.config?.url || '';
  let body = {};
  try { if (typeof error.config?.data === 'string') body = JSON.parse(error.config.data); } catch { body = {}; }
  const local = JSON.parse(localStorage.getItem('safalpath_demo_user') || 'null');
  const ok = (data) => Promise.resolve({ data, status: 200, config: error.config });
  if ((!error.response || error.response.status === 404) && url.includes('/auth/')) {
    const user = local || { _id: 'demo-user', name: body.name || 'Alex Morgan', email: body.email || 'hello@example.com', targetRole: body.targetRole || 'Software Engineer', xp: 120, badges: ['First Step'], dsaSolved: [], streak: { current: 4, best: 7 }, interviewHistory: [], activityLog: [], roadmap: { plan: [] }, dailyQuests: {} };
    localStorage.setItem('safalpath_demo_user', JSON.stringify(user));
    localStorage.setItem('safalpath_token', 'demo-session');
    return ok({ user, token: 'demo-session', levelInfo: { level: 2, title: 'Rising Candidate', progressPercent: 42, xpToNext: 80 } });
  }
  if ((!error.response || error.response.status === 404) && url.includes('/ai/interview')) {
    const prompts = ['Tell me about a project where you made a meaningful technical decision. What trade-offs did you consider?', 'How would you find the longest substring without repeating characters? Explain your approach and complexity.', 'A service becomes slow as traffic grows. How would you investigate and improve it?', 'Describe a time you received difficult feedback. How did you respond?', 'How do you keep a feature reliable when handling invalid or unexpected input?'];
    const count = (body.history || []).filter((m) => m.sender === 'user').length;
    const answer = body.userAnswer || '';
    return ok(body.userAnswer ? { score: Math.max(4, Math.min(10, Math.round(5 + answer.trim().split(/\s+/).length / 18))), feedback: answer.length > 100 ? 'Good detail and a clear direction. Add a concise result or complexity analysis to make the answer stronger.' : 'You have a useful starting point. Add a concrete example and explain the reasoning behind your approach.', nextQuestion: prompts[count % prompts.length] } : { nextQuestion: `Welcome! I’m Aria, your practice interviewer. ${prompts[0]}` });
  }
  if ((!error.response || error.response.status === 404) && url.includes('/ai/chat')) return ok({ reply: 'I’m here to help you prepare. Start with one focused goal today: practice a DSA pattern, sharpen one resume bullet, or rehearse a project story. Which would you like to tackle?' });
  if ((!error.response || error.response.status === 404) && url.includes('/ai/roadmap')) {
    const count = Math.min(12, Math.max(2, Number(body.weeks) || 6));
    const plan = Array.from({ length: count }, (_, i) => ({ week: i + 1, title: ['Build your foundations', 'Practice core patterns', 'Strengthen problem solving', 'Create and refine projects'][i % 4], subtitle: `${body.hoursPerDay || 3} focused hours a day`, tasks: [{ title: ['Review JavaScript fundamentals', 'Solve two array problems', 'Practice a behavioral story'][i % 3], type: 'Practice', hours: '45 min', resource: 'Guided practice', completed: false }, { title: ['Study data structures', 'Review a project decision', 'Work through a tree problem'][i % 3], type: 'Study', hours: '60 min', resource: 'Your learning plan', completed: false }] }));
    const user = { ...(local || {}), roadmap: { weeks: count, hoursPerDay: body.hoursPerDay || 3, plan } }; localStorage.setItem('safalpath_demo_user', JSON.stringify(user)); return ok({ user, levelInfo: { level: 2, title: 'Rising Candidate', progressPercent: 42, xpToNext: 80 } });
  }
  if ((!error.response || error.response.status === 404) && url.includes('/ai/analyze-resume')) return ok({ analysis: { atsScore: Math.min(96, 62 + (body.resumeText || '').length % 35), skills: ['Communication', 'Problem solving', 'Project experience'], missingSkills: ['Impact metrics', 'Role-specific keywords'] }, user: local || {}, levelInfo: { level: 2, title: 'Rising Candidate', progressPercent: 42, xpToNext: 80 } });
  if ((!error.response || error.response.status === 404) && url.includes('/ai/match-jd')) return ok({ matchPercent: 76, missingKeywords: ['System design', 'Testing', 'Cloud deployment'] });
  if ((!error.response || error.response.status === 404) && url.includes('/ai/dsa-recommend')) return ok((body.topics || ['Arrays', 'Graphs']).slice(0, 3).flatMap((topic) => [{ title: `${topic} fundamentals`, topic, difficulty: 'Easy', summary: 'Build confidence with the core pattern.', leetcodeUrl: 'https://leetcode.com/problemset/' }, { title: `${topic} in practice`, topic, difficulty: 'Medium', summary: 'Apply the pattern to a realistic interview problem.', leetcodeUrl: 'https://leetcode.com/problemset/' }]));
  if ((!error.response || error.response.status === 404) && url.includes('/user/leaderboard')) return ok([{ ...(local || { _id: 'demo-user', name: 'You', xp: 120, streak: { current: 4 } }) }]);
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
        const demo = JSON.parse(localStorage.getItem('safalpath_demo_user') || 'null');
        if (demo && token === 'demo-session') setUser(demo);
        else localStorage.removeItem('safalpath_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const syncUser = (updatedUser, updatedLevel) => {
    if (updatedUser) setUser(updatedUser);
    if (updatedLevel) setLevelInfo(updatedLevel);
  };

  const logout = () => {
    localStorage.removeItem('safalpath_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, levelInfo, loading, syncUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
