import { useEffect, useRef, useState } from 'react';
import { Sparkles, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

const TOPICS = ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Binary Search', 'Stack/Queue', 'Heap', 'Greedy', 'Sliding Window'];
const COMPANIES = ['Daily mix', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Adobe', 'Flipkart', 'TCS', 'Infosys'];

export default function DsaRecommender() {
  const { user, syncUser } = useAuth();
  const [selected, setSelected] = useState(['Graphs', 'Dynamic Programming']);
  const [company, setCompany] = useState('Daily mix');
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const loadedOnce = useRef(false);

  const toggleTopic = (t) => {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const curate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/ai/dsa-recommend', { topics: selected, company });
      setProblems(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not get recommendations. Check the API and AI configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!loadedOnce.current) { loadedOnce.current = true; curate(); } }, []);

  const markSolved = async (prob) => {
    setSaveError('');
    try { const { data } = await API.post('/user/dsa/solve', prob); syncUser(data.user, data.levelInfo); }
    catch (err) { setSaveError(err.response?.data?.error || 'Could not save this problem as solved.'); }
  };

  const filtered = problems.filter((p) => filter === 'All' || p.difficulty === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DSA Recommender</h1>
        <p className="text-sm text-gray-500">Daily interview practice organized around company patterns and the topics you want to strengthen.</p>
      </div>
      {error && <div className="inline-error">{error}</div>}
      {saveError && <div className="inline-error">{saveError}</div>}

      <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-4">
        <label className="company-select-label">Company practice<select value={company} onChange={(e) => setCompany(e.target.value)}>{COMPANIES.map((name) => <option key={name}>{name}</option>)}</select><small>Practice common interview patterns associated with this company.</small></label>
        <p className="text-sm font-bold">Your weak topics</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = selected.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {t} {active && '×'}
              </button>
            );
          })}
        </div>
        <button onClick={curate} disabled={loading} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Sparkles size={16} /> {loading ? 'Curating...' : 'Curate problems'}
        </button>
      </div>

      {problems.length > 0 && (
        <>
          <div className="flex gap-2">
            {['All', 'Easy', 'Medium', 'Hard'].map((lvl) => (
              <button key={lvl} onClick={() => setFilter(lvl)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold ${filter === lvl ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                {lvl}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((p) => {
              const solved = user?.dsaSolved?.some((s) => s.title === p.title);
              const badgeColor = p.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' : p.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600';
              return (
                <div key={p.title} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => markSolved(p)} disabled={solved} aria-label={solved ? `${p.title} solved` : `Mark ${p.title} solved`}>
                      {solved ? <CheckCircle2 className="text-[#FF6B00]" size={20} /> : <Circle className="text-orange-300" size={20} />}
                    </button>
                    <div>
                      <h4 className="font-bold text-sm">{p.title}</h4>
                      <p className="text-xs text-gray-400">{p.topic} · {p.summary}</p>
                      <details className="problem-description"><summary>Problem description</summary><p>{p.description || p.summary}</p></details>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>{p.difficulty}</span>
                    <a href={p.leetcodeUrl} target="_blank" rel="noreferrer" className="text-[#FF6B00]"><ExternalLink size={16} /></a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
