import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Flame, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('safalpath-theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('safalpath-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      className="flex items-center gap-2 px-3 py-2 rounded-xl border theme-card hover:scale-105 transition-all cursor-pointer shadow-sm"
    >
      {dark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-zinc-700" />
          <span className="text-xs font-semibold">Dark</span>
        </>
      )}
    </button>
  );
}

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/resume': 'ATS Resume Analyzer',
  '/resume-builder': 'Job Ready Resume Builder',
  '/jobs': 'Job Boards & Applications',
  '/jd-matcher': 'Job Description Matcher',
  '/dsa': 'DSA Problem Recommender',
  '/coding': 'Live DSA Arena',
  '/interview': 'AI Mock Interviewer',
  '/roadmap': 'Placement Roadmap',
  '/rewards': 'XP & Badges',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'SafalPath Workspace';

  return (
    <header className="w-full px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between theme-card">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="font-extrabold text-lg tracking-tight text-orange-500">
          SafalPath
        </Link>
        <span className="opacity-30">/</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <><div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold"><Flame className="w-3.5 h-3.5" /><span>{user.xp || 0} XP</span></div><Link to="/rewards" className="user-avatar-chip" title="Profile, avatar, and rewards"><span>{user.avatar || '🌱'}</span><small>{user.name?.split(' ')[0] || 'Profile'}</small></Link><button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }} className="logout-button" aria-label="Log out"><LogOut size={15}/><span>Log out</span></button></>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
