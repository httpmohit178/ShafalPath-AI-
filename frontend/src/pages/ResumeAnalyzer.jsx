import { useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function ResumeAnalyzer() {
  const { user, syncUser } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('targetRole', targetRole);
      formData.append('resumeText', resumeText);
      if (file) formData.append('resumePdf', file);

      const { data } = await API.post('/ai/analyze-resume', formData);
      setAnalysis(data.analysis);
      syncUser(data.user, data.levelInfo);
    } catch (err) {
      alert(err.response?.data?.error || 'Error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600">Target role</label>
          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Frontend Developer, Data Analyst" className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 text-sm" />
        </div>

        <label className="border-2 border-dashed border-orange-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/40">
          <Upload className="text-[#FF6B00] mb-2" size={24} />
          <span className="text-sm font-medium">{file ? file.name : 'Upload resume PDF or .txt'}</span>
          <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
        </label>

        <div className="text-center text-xs text-gray-400">— or paste text —</div>

        <textarea rows={5} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume text here..." className="w-full p-4 rounded-xl border border-gray-200 text-sm" />

        <button onClick={handleAnalyze} disabled={loading} className="w-full bg-[#FF6B00] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600">
          <Sparkles size={18} /> {loading ? 'Analyzing with AI...' : 'Analyze resume'}
        </button>
      </div>

      {analysis && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">ATS Compatibility Score</h3>
            <span className="text-3xl font-extrabold text-[#FF6B00]">{analysis.atsScore}/100</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">EXTRACTED SKILLS</p>
            <div className="flex flex-wrap gap-2">
              {analysis.skills?.map((s) => <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">{s}</span>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">MISSING SKILLS FOR {targetRole.toUpperCase()}</p>
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills?.map((s) => <span key={s} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">{s}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}