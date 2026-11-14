import { useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const JOB_SITES = [
  { name: 'LinkedIn Jobs', type: 'Professional network', description: 'Search roles, follow employers, and apply through job listings.', url: (q, place) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(place)}` },
  { name: 'Indeed', type: 'Job search', description: 'Search full-time, part-time, entry-level, and other roles.', url: (q, place) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(place)}` },
  { name: 'Naukri', type: 'India jobs', description: 'Search Indian job listings across industries and experience levels.', url: () => 'https://www.naukri.com/' },
  { name: 'Wellfound', type: 'Startup roles', description: 'Explore startup and technology company jobs.', url: () => 'https://wellfound.com/jobs' },
  { name: 'Glassdoor', type: 'Jobs & company research', description: 'Look for openings and research employers before applying.', url: (q) => `https://www.glassdoor.co.in/Job/index.htm?sc.keyword=${encodeURIComponent(q)}` },
  { name: 'Microsoft Careers', type: 'Company careers', description: 'Search openings directly on Microsoft’s careers site.', url: (q) => `https://careers.microsoft.com/v2/global/en/search?lc=India&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true&keywords=${encodeURIComponent(q)}` },
];
export default function JobBoards() {
  const { user } = useAuth(); const [role, setRole] = useState(user?.targetRole || ''); const [location, setLocation] = useState('India'); const query = role.trim() || 'Entry level jobs';
  return <div className="job-boards-page space-y-6">
    <div><span className="eyebrow"><BriefcaseBusiness size={14}/> YOUR NEXT OPPORTUNITY</span><h1 className="page-title">Find roles and apply.</h1><p className="page-subtitle">Search trusted job boards and company career pages. Review each listing and apply directly on the employer or job site.</p></div>
    <section className="theme-card job-search-form"><label><Search size={16}/> Job title or keywords<input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Sales Associate, React Developer"/></label><label><MapPin size={16}/> Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country, or Remote"/></label><Link className="primary-button" to="/resume-builder"><CheckCircle2 size={16}/> Prepare my resume</Link></section>
    <div className="job-sites-grid">{JOB_SITES.map((site) => <article className="theme-card job-site-card" key={site.name}><span>{site.type}</span><h2>{site.name}</h2><p>{site.description}</p><a href={site.url(query, location)} target="_blank" rel="noreferrer">Search {site.name}<ArrowUpRight size={15}/></a></article>)}</div>
    <section className="theme-card application-checklist"><div><h2>Before you apply</h2><p>A short checklist helps you send a complete application.</p></div><ol><li>Check that your resume matches the exact job title and requirements.</li><li>Replace placeholders and verify every date, skill, and result.</li><li>Use a role-specific cover note when the application asks for one.</li><li>Track the company, role, application date, and follow-up.</li></ol><div className="checklist-links"><Link to="/resume">Analyze resume</Link><Link to="/resume-builder">Build resume</Link><Link to="/jd-matcher">Match a job description</Link></div></section>
  </div>;
}
