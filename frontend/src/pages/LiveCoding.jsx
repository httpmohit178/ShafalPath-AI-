import { useState } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function LiveCoding() {
  const { syncUser } = useAuth();
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Easy');
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateProblem = async () => {
    setLoading(true);
    setVerdict(null);
    try {
      const { data } = await API.post('/ai/coding', { action: 'generate', topic, difficulty });
      setProblem(data);
      setCode(data.boilerplates?.[language] || '');
    } finally {
      setLoading(false);
    }
  };

  const handleLangChange = (lang) => {
    setLanguage(lang);
    if (problem?.boilerplates?.[lang]) setCode(problem.boilerplates[lang]);
  };

  const submitCode = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/ai/coding', { action: 'submit', problem, language, code });
      setVerdict(data.verdict);
      if (data.user) syncUser(data.user, data.levelInfo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Coding</h1>
        <p className="text-sm text-gray-500">LeetCode-style AI problems with examples, multi-language boilerplate, test cases and AI code review.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="px-4 py-2 rounded-xl bg-orange-50 text-[#FF6B00] font-semibold text-sm">
          {['Arrays', 'Strings', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Tree', 'Graphs (BFS/DFS)', 'Dynamic Programming'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium">
          {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
        </select>

        <button onClick={generateProblem} disabled={loading} className="bg-[#FF6B00] text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Sparkles size={16} /> {loading ? 'Generating...' : 'New problem'}
        </button>
      </div>

      {problem && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{problem.title}</h2>
              <span className="px-3 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">{problem.difficulty}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{problem.description}</p>
            <div className="bg-[#FAF8F5] p-3 rounded-xl text-xs font-mono">
              <p><strong>Example Input:</strong> {problem.example?.input}</p>
              <p><strong>Output:</strong> {problem.example?.output}</p>
            </div>
          </div>

          <div className="bg-[#121622] rounded-3xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center">
              <select value={language} onChange={(e) => handleLangChange(e.target.value)} className="bg-[#1E2436] text-white px-3 py-1.5 rounded-lg text-xs border border-orange-500/40">
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
              <button onClick={submitCode} disabled={loading} className="bg-[#FF6B00] text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1">
                <Play size={14} /> Run & Submit
              </button>
            </div>

            <textarea
              rows={12}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-transparent font-mono text-sm text-emerald-300 focus:outline-none"
            />
          </div>

          {verdict && (
            <div className={`p-5 rounded-2xl border ${verdict.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className="font-bold text-sm">{verdict.passed ? `✅ Accepted (${verdict.passedTests} test cases)` : '❌ Wrong Answer'}</h4>
              <p className="text-xs text-gray-700 mt-2">{verdict.aiReview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}