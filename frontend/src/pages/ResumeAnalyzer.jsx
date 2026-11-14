import { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Download, FileText, Lightbulb, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';

export default function ResumeAnalyzer() {
  const { user, syncUser } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Software Engineer');
  const [resumeText, setResumeText] = useState(user?.resumeText || '');
  const [file, setFile] = useState(null); const [analysis, setAnalysis] = useState(() => user?.resumeRewrite ? { atsScore: user.atsScore || 0, summary: 'Saved resume review. Re-run analysis for updated feedback.', skills: user.skills || [], missingSkills: user.missingSkills || [], strengths: [], experienceInsights: [], improvements: [], suggestedProjects: [], correctedResume: user.resumeRewrite } : null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const downloadText = (name, content) => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); link.download = name; link.click(); URL.revokeObjectURL(link.href); };
  const handleAnalyze = async () => {
    if (!file && !resumeText.trim()) { setError('Upload your resume or paste its text to begin.'); return; }
    if (user?.demoMode && file?.type === 'application/pdf' && !resumeText.trim()) { setError('PDF text extraction needs the backend. Paste the resume text here, or start the backend to analyze this PDF.'); return; }
    setLoading(true); setError('');
    try { const body = new FormData(); body.append('targetRole', targetRole); body.append('resumeText', file && file.type !== 'application/pdf' ? await file.text() : resumeText); if (file) body.append('resumePdf', file); const { data } = await API.post('/ai/analyze-resume', body); setAnalysis({ ...data.analysis, aiMode: data.aiMode || 'groq' }); syncUser(data.user, data.levelInfo); }
    catch (err) { setError(err.response?.data?.error || 'Resume analysis failed. Check the PDF is readable and the backend is running.'); }
    finally { setLoading(false); }
  };
  return <div className="space-y-6 resume-page">
    <div className="resume-heading-row"><div><span className="eyebrow"><Sparkles size={14}/> PERSONALIZED RESUME REVIEW</span><h1 className="page-title">Turn your resume into a plan.</h1><p className="page-subtitle">Get a detailed role match, evidence based skills gaps, and concrete next steps.</p></div><div><Link to="/resume-builder" className="secondary-button">Build a resume</Link><Link to="/jobs" className="primary-button">Find jobs</Link></div></div>
    <section className="theme-card resume-form">
      <label>Target role<input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Frontend Developer"/></label>
      <label className="upload-zone"><Upload size={24}/><b>{file ? file.name : 'Choose a PDF or text resume'}</b><small>PDF or .txt · max 5 MB</small><input type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)}/></label>
      <div className="or-divider">or paste resume text</div><textarea rows={7} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume here…"/>
      {error && <p className="inline-error"><AlertCircle size={16}/>{error}</p>}
      <button className="primary-button" disabled={loading} onClick={handleAnalyze}><Sparkles size={17}/>{loading ? 'Analyzing your experience…' : 'Analyze my resume'}</button>
    </section>
    {analysis && <div className="resume-results">
      <section className="theme-card ats-card"><div><small>ATS ROLE MATCH</small><b>{analysis.atsScore}<i>/100</i></b><p>{analysis.summary}</p></div><div className="ats-ring" style={{'--score':`${analysis.atsScore}%`}}><span>{analysis.atsScore}%</span></div></section>
      <section className="theme-card result-section"><h2><CheckCircle2 size={19}/> Skills found in your resume</h2><div className="skill-chips">{analysis.skills?.map((s) => <span key={s}>{s}</span>)}</div><h3>Role skills to build</h3><div className="skill-chips missing">{analysis.missingSkills?.map((s) => <span key={s}>{s}</span>)}</div></section>
      {analysis.skillGaps?.length > 0 && <section className="theme-card result-section"><h2><Lightbulb size={19}/> Your skill gap plan</h2><div className="gap-grid">{analysis.skillGaps.map((gap) => <article key={gap.skill}><b>{gap.skill}</b><p>{gap.whyItMatters}</p><small>NEXT STEP</small><p>{gap.nextStep}</p></article>)}</div></section>}
      {analysis.aiMode === 'local' && <div className="resume-local-note"><Sparkles size={15}/> Local resume audit is active. It checks common issues and gives a structured draft; add a Groq key for contextual AI review.</div>}
      <section className="theme-card result-section"><h2><AlertCircle size={19}/> Resume issue checklist <span className="issue-count">{analysis.issues?.length || 0} items</span></h2><p className="resume-checklist-note">These checks flag issues visible in the supplied text. Review the original document too; no automated scan can guarantee that every error is found.</p>{analysis.issues?.length ? <div className="gap-grid">{analysis.issues.map((issue, idx) => <article key={`${issue.issue}-${idx}`}><b>{issue.issue}</b><p>{issue.whyItHurts}</p><small>HOW TO FIX</small><p>{issue.fix}</p></article>)}</div> : <div className="resume-clear-state"><CheckCircle2 size={18}/> No common issues were detected in the text. Review dates, links, and formatting before applying.</div>}</section>
      <div className="result-columns"><section className="theme-card result-section"><h2><FileText size={19}/> What’s already working</h2><ul>{analysis.strengths?.map((x) => <li key={x}>{x}</li>)}</ul><h3>Experience insights</h3><ul>{analysis.experienceInsights?.map((x) => <li key={x}>{x}</li>)}</ul></section><section className="theme-card result-section"><h2><Sparkles size={19}/> Make your resume stronger</h2><ul>{analysis.improvements?.map((x) => <li key={x}>{x}</li>)}</ul><h3>Project ideas</h3><ul>{analysis.suggestedProjects?.map((x) => <li key={x}>{x}</li>)}</ul></section></div>
      {analysis.correctedResume && <section className="theme-card result-section corrected-resume"><div className="corrected-header"><div><h2><CheckCircle2 size={19}/> Job-ready resume draft</h2><p>ATS-readable structure tailored to {targetRole}. Verify every fact and replace the highlighted placeholders before applying. No resume can guarantee a shortlist.</p></div><div><button className="secondary-button" onClick={async () => { await navigator.clipboard.writeText(analysis.correctedResume); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><Copy size={14}/>{copied ? 'Copied' : 'Copy'}</button><button className="secondary-button" onClick={() => downloadText('safalpath-resume-draft.txt', analysis.correctedResume)}><Download size={14}/>Download</button></div></div><pre>{analysis.correctedResume}</pre><Link className="primary-button" to="/resume-builder">Open resume builder <FileText size={16}/></Link></section>}
    </div>}
  </div>;
}
