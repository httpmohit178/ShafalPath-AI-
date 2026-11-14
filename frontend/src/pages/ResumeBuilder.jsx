import { useState } from 'react';
import { Download, Eye, Printer, Save, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';

const resumeSection = (resume, headings) => {
  const rows = String(resume || '').split(/\r?\n/);
  const isHeading = (row) => headings.includes(row.trim().replace(/[:#]/g, '').toLowerCase());
  const start = rows.findIndex(isHeading);
  if (start < 0) return '';
  let end = rows.length;
  for (let i = start + 1; i < rows.length; i += 1) if (/^[A-Z][A-Z &/()-]{2,}:?$/.test(rows[i].trim())) { end = i; break; }
  return rows.slice(start + 1, end).join('\n').trim();
};
const emptyDraft = (user) => {
  const generated = user?.resumeRewrite || '';
  const firstLine = generated.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !/^(contact|professional summary|summary|skills|experience|projects|education)$/i.test(line));
  return { fullName: user?.resumeDraft?.fullName || (firstLine && firstLine.length < 70 ? firstLine : '') || user?.name || '', email: user?.resumeDraft?.email || user?.email || (generated.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''), location: user?.resumeDraft?.location || '', title: user?.resumeDraft?.title || user?.targetRole || '', summary: user?.resumeDraft?.summary || resumeSection(generated, ['summary', 'professional summary', 'profile']), skills: user?.resumeDraft?.skills || resumeSection(generated, ['skills', 'technical skills']) || (user?.skills || []).join(', '), experience: user?.resumeDraft?.experience || resumeSection(generated, ['experience', 'work experience', 'professional experience']) || user?.resumeText || '', projects: user?.resumeDraft?.projects || resumeSection(generated, ['projects', 'selected projects']), education: user?.resumeDraft?.education || resumeSection(generated, ['education']) };
};
const sections = [['fullName', 'Full name', 'input'], ['email', 'Email', 'input'], ['location', 'Location', 'input'], ['title', 'Target title', 'input'], ['summary', 'Professional summary', 'textarea'], ['skills', 'Skills (comma separated)', 'textarea'], ['experience', 'Work experience', 'textarea'], ['projects', 'Projects', 'textarea'], ['education', 'Education', 'textarea']];
export default function ResumeBuilder() {
  const { user, syncUser } = useAuth(); const [draft, setDraft] = useState(() => emptyDraft(user)); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const update = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const save = async () => { setSaving(true); setMessage(''); try { const { data } = await API.put('/user/resume-draft', draft); syncUser(data.user, data.levelInfo); setMessage('Resume draft saved to your account.'); } catch (err) { setMessage(err.response?.data?.error || 'Could not save your resume draft.'); } finally { setSaving(false); } };
  const download = () => { const text = `${draft.fullName}\n${draft.title}\n${draft.email} · ${draft.location}\n\nSUMMARY\n${draft.summary}\n\nSKILLS\n${draft.skills}\n\nEXPERIENCE\n${draft.experience}\n\nPROJECTS\n${draft.projects}\n\nEDUCATION\n${draft.education}`; const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'SafalPath-job-ready-resume.txt'; link.click(); URL.revokeObjectURL(url); };
  const lines = (value) => value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return <div className="career-builder-page space-y-6">
    <div className="career-page-heading"><div><span className="eyebrow"><Sparkles size={14}/> READY FOR YOUR NEXT STEP</span><h1 className="page-title">Build a clear, job-ready resume.</h1><p className="page-subtitle">Fill in each section, check the live preview, then print to PDF or download a text copy. Keep every claim accurate.</p></div><Link className="secondary-button" to="/resume">Review resume with Aria <Sparkles size={14}/></Link></div>
    {message && <div className="inline-error resume-save-message">{message}</div>}
    <div className="builder-layout"><section className="theme-card builder-form"><div className="section-title"><div><h2>Your details</h2><p>Use short, evidence-based sentences. Add results only when you can support them.</p></div></div>{sections.map(([key, label, type]) => <label className="builder-field" key={key}>{label}{type === 'textarea' ? <textarea rows={key === 'summary' ? 4 : 6} value={draft[key]} onChange={(e) => update(key, e.target.value)} placeholder={key === 'experience' ? 'Role · Company · Dates\nDescribe what you did and the outcome…' : `Add your ${label.toLowerCase()}…`}/> : <input value={draft[key]} onChange={(e) => update(key, e.target.value)} placeholder={label}/>}</label>)}<div className="builder-actions"><button className="primary-button" disabled={saving} onClick={save}><Save size={16}/>{saving ? 'Saving…' : 'Save resume'}</button><button className="secondary-button" onClick={download}><Download size={16}/> Download text</button><button className="secondary-button" onClick={() => window.print()}><Printer size={16}/> Print / save PDF</button></div></section>
      <section className="builder-preview-wrap"><div className="preview-label"><Eye size={15}/> LIVE PREVIEW</div><article className="resume-paper resume-print"><header><h2>{draft.fullName || 'Your Name'}</h2><b>{draft.title || 'Target Role'}</b><small>{[draft.email, draft.location].filter(Boolean).join(' · ') || 'Email · Location · Portfolio / LinkedIn'}</small></header>{[['SUMMARY', draft.summary], ['SKILLS', draft.skills], ['EXPERIENCE', draft.experience], ['PROJECTS', draft.projects], ['EDUCATION', draft.education]].map(([heading, content]) => <section key={heading}><h3>{heading}</h3>{heading === 'SKILLS' && content ? <div className="resume-skill-list">{content.split(',').map((skill) => <span key={skill}>{skill.trim()}</span>)}</div> : lines(content || '').map((line, idx) => <p key={`${heading}-${idx}`}>{line}</p>)}</section>)}</article><p className="preview-note">Preview updates as you type. Print / save PDF opens your browser’s print dialog.</p></section></div>
  </div>;
}
