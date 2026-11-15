import { useState } from 'react';
import { Download, Eye, Printer, Save, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';

const templates = [
  { id: 'classic', name: 'Classic', detail: 'ATS-friendly · Traditional', mark: 'A' },
  { id: 'modern', name: 'Modern', detail: 'Clean · Contemporary', mark: 'M' },
  { id: 'compact', name: 'Compact', detail: 'Space-saving · Minimal', mark: 'C' },
  { id: 'executive', name: 'Executive', detail: 'Confident · Refined', mark: 'E' },
];
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
  return { ...(user?.resumeDraft || {}), fullName: user?.resumeDraft?.fullName || (firstLine && firstLine.length < 70 ? firstLine : '') || user?.name || '', email: user?.resumeDraft?.email || user?.email || (generated.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''), location: user?.resumeDraft?.location || '', title: user?.resumeDraft?.title || user?.targetRole || '', summary: user?.resumeDraft?.summary || resumeSection(generated, ['summary', 'professional summary', 'profile']), skills: user?.resumeDraft?.skills || resumeSection(generated, ['skills', 'technical skills']) || (user?.skills || []).join(', '), experience: user?.resumeDraft?.experience || resumeSection(generated, ['experience', 'work experience', 'professional experience']) || user?.resumeText || '', projects: user?.resumeDraft?.projects || resumeSection(generated, ['projects', 'selected projects']), education: user?.resumeDraft?.education || resumeSection(generated, ['education']) };
};
const sections = [['fullName', 'Full name', 'input'], ['email', 'Email', 'input'], ['location', 'Location', 'input'], ['title', 'Target title', 'input'], ['summary', 'Professional summary', 'textarea'], ['skills', 'Skills (one per line or comma separated)', 'textarea'], ['experience', 'Work experience (one role per line)', 'textarea'], ['projects', 'Projects (one project per line)', 'textarea'], ['education', 'Education (one qualification per line)', 'textarea']];
const lines = (value) => String(value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);

export default function ResumeBuilder() {
  const { user, syncUser } = useAuth();
  const [draft, setDraft] = useState(() => emptyDraft(user));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [printZoom, setPrintZoom] = useState(1);
  const update = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const save = async () => { setSaving(true); setMessage(''); try { const { data } = await API.put('/user/resume-draft', draft); syncUser(data.user, data.levelInfo); setMessage('Resume draft saved to your account.'); } catch (err) { setMessage(err.response?.data?.error || 'Could not save your resume draft.'); } finally { setSaving(false); } };
  const download = () => {
    const escape = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const sectionsHtml = [['Profile', draft.summary], ['Core skills', draft.skills], ['Experience', draft.experience], ['Selected projects', draft.projects], ['Education', draft.education]].filter(([, value]) => String(value || '').trim()).map(([title, value]) => `<section><h2>${title}</h2>${title === 'Core skills' ? `<div class="skills">${String(value).split(/[\n,]+/).filter(Boolean).map((skill) => `<span>${escape(skill.trim())}</span>`).join('')}</div>` : `<div class="entries">${lines(value).map((line) => `<p>${escape(line)}</p>`).join('')}</div>`}</section>`).join('');
    const accent = draft.template === 'executive' ? '#8a7146' : draft.template === 'modern' ? '#bd693e' : '#315d45';
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(draft.fullName || 'Resume')} · Resume</title><style>*{box-sizing:border-box}body{margin:0;background:#edf0ec;color:#26312a;font:14px/1.5 Arial,Helvetica,sans-serif}.toolbar{max-width:820px;margin:22px auto 12px;display:flex;justify-content:flex-end}.toolbar button{border:0;border-radius:8px;padding:10px 15px;background:${accent};color:#fff;font-weight:700;cursor:pointer}.paper{--accent:${accent};width:210mm;min-height:297mm;margin:0 auto 30px;padding:17mm 19mm;background:white;box-shadow:0 12px 45px #15201720}.head{padding:0 0 17px;border-bottom:2px solid var(--accent)}h1{font-size:28px;line-height:1.15;letter-spacing:.2px;margin:0 0 6px;color:#1e2a22}.role{font-size:14px;font-weight:700;color:var(--accent)}.contact{margin-top:9px;color:#5e685f;font-size:11px}section{margin-top:19px;break-inside:avoid}h2{font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:var(--accent);padding-bottom:6px;border-bottom:1px solid #dce3dc;margin:0 0 8px}.entries p{font-size:11px;line-height:1.48;white-space:pre-wrap;margin:4px 0;overflow-wrap:anywhere}.skills{display:flex;flex-wrap:wrap;gap:6px}.skills span{font-size:10px;background:#f0f4f0;border:1px solid #e3e9e3;border-radius:99px;padding:4px 9px}@media print{@page{size:A4;margin:0}body{background:#fff}.toolbar{display:none}.paper{zoom:var(--fit,1);width:calc(210mm / var(--fit,1));min-height:calc(297mm / var(--fit,1));margin:0;padding:15mm 17mm;box-shadow:none}}@media(max-width:820px){body{background:#fff}.toolbar{margin:12px}.paper{width:100%;min-height:100vh;margin:0;padding:28px 22px;box-shadow:none}}</style></head><body><div class="toolbar"><button onclick="const p=document.querySelector('.paper');p.style.setProperty('--fit',Math.min(1,1060/p.scrollHeight));window.print()">Print / Save as one-page PDF</button></div><main class="paper"><header class="head"><h1>${escape(draft.fullName || 'Your Name')}</h1><div class="role">${escape(draft.title || 'Target Role')}</div><div class="contact">${[draft.email, draft.location].filter(Boolean).map(escape).join(' &nbsp;·&nbsp; ')}</div></header>${sectionsHtml}</main></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${String(draft.fullName || 'SafalPath').replace(/[^a-z0-9-_]+/gi, '-')}-resume.html`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const preparePrint = () => {
    const paper = document.querySelector('.resume-print');
    if (!paper) return;
    const available = 1040; // Approximate printable A4 height at 96 dpi after margins.
    const content = paper.scrollHeight;
    setPrintZoom(Math.max(0.55, Math.min(1, available / content)));
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  };
  return <div className="career-builder-page space-y-6">
    <div className="career-page-heading"><div><span className="eyebrow"><Sparkles size={14}/> READY FOR YOUR NEXT STEP</span><h1 className="page-title">Build a clear, job-ready resume.</h1><p className="page-subtitle">Choose a layout, fill in your experience, and export a clean A4 PDF. Keep every claim accurate.</p></div><Link className="secondary-button" to="/resume">Review resume with Aria <Sparkles size={14}/></Link></div>
    {message && <div className="inline-error resume-save-message">{message}</div>}
    <section className="template-picker theme-card" aria-label="Choose a resume template"><div><h2>Choose your template</h2><p>All four layouts keep selectable text and a simple reading order for applicant tracking systems.</p></div><div className="template-options">{templates.map((item) => <button type="button" key={item.id} className={`template-option ${draft.template === item.id || (!draft.template && item.id === 'classic') ? 'selected' : ''}`} aria-pressed={draft.template === item.id || (!draft.template && item.id === 'classic')} onClick={() => update('template', item.id)}><span className={`template-thumb template-thumb-${item.id}`} aria-hidden="true"><b>{item.mark}</b><i/><i/><i/></span><span><strong>{item.name}</strong><small>{item.detail}</small></span></button>)}</div></section>
    <div className="builder-layout"><section className="theme-card builder-form"><div className="section-title"><div><h2>Your details</h2><p>Add as many entries as you need: put each skill, role, project, or qualification on a new line. Keep descriptions concise to fit one page.</p></div></div>{sections.map(([key, label, type]) => <label className="builder-field" key={key}>{label}{type === 'textarea' ? <textarea rows={key === 'summary' ? 4 : 6} value={draft[key] || ''} onChange={(e) => update(key, e.target.value)} placeholder={key === 'experience' ? 'Frontend Intern · Acme · 2024\n• Built…\nSoftware Developer · Example · 2023\n• Improved…' : key === 'projects' ? 'Portfolio website · React, CSS · 2025\n• Built a responsive site…\nInventory tracker · Node.js · 2024\n• Added…' : key === 'education' ? 'B.Tech Computer Science · Example University · 2025\nDiploma…' : key === 'skills' ? 'JavaScript, React, Node.js\nSQL, Git, Testing' : `Add your ${label.toLowerCase()}…`}/> : <input value={draft[key] || ''} onChange={(e) => update(key, e.target.value)} placeholder={label}/>}</label>)}<div className="builder-actions"><button className="primary-button" disabled={saving} onClick={save}><Save size={16}/>{saving ? 'Saving…' : 'Save resume'}</button><button className="secondary-button" onClick={download}><Download size={16}/> Download styled resume</button><button className="secondary-button" onClick={preparePrint}><Printer size={16}/> Print / save one-page PDF</button></div></section>
      <section className="builder-preview-wrap"><div className="preview-label"><Eye size={15}/> LIVE PREVIEW · {templates.find((item) => item.id === draft.template)?.name || 'Classic'}</div><article style={{'--print-zoom': printZoom}} className={`resume-paper resume-print resume-template-${draft.template || 'classic'}`}><header><h2>{draft.fullName || 'Your Name'}</h2><b>{draft.title || 'Target Role'}</b><small>{[draft.email, draft.location].filter(Boolean).join(' · ') || 'Email · Location · Portfolio / LinkedIn'}</small></header>{[['SUMMARY', draft.summary], ['SKILLS', draft.skills], ['EXPERIENCE', draft.experience], ['PROJECTS', draft.projects], ['EDUCATION', draft.education]].filter(([, content]) => String(content || '').trim()).map(([heading, content]) => <section key={heading}><h3>{heading}</h3>{heading === 'SKILLS' && content ? <div className="resume-skill-list">{content.split(/[\n,]+/).map((skill) => <span key={skill}>{skill.trim()}</span>)}</div> : lines(content).map((line, idx) => <p key={`${heading}-${idx}`}>{line}</p>)}</section>)}</article><p className="preview-note">Download a styled resume file, then use its Print / Save as PDF button for a one-page A4 copy. Long entries are automatically scaled to fit.</p></section></div>
  </div>;
}
