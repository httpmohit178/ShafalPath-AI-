import { useState } from 'react';
import { Target } from 'lucide-react';
import { API } from '../context/AuthContext';

export default function JdMatcher() {
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    try {
      const { data } = await API.post('/ai/match-jd', { company, jobDescription });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JD Matcher</h1>
        <p className="text-sm text-gray-500">Compare your resume against any job description to see your match % and missing keywords.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-4">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
        <textarea rows={7} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description..." className="w-full p-4 rounded-xl border border-gray-200 text-sm" />
        <button onClick={handleMatch} disabled={loading} className="w-full bg-[#FF6B00] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600">
          <Target size={18} /> {loading ? 'Matching...' : 'Match with my resume'}
        </button>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Job Match Score</h3>
            <span className="text-3xl font-extrabold text-[#FF6B00]">{result.matchPercent}%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">MISSING KEYWORDS TO ADD</p>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords?.map((k) => <span key={k} className="px-3 py-1 bg-orange-50 text-[#FF6B00] rounded-full text-xs font-semibold">{k}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}