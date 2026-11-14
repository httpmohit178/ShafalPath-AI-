import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, Target, Map, Mic, ListChecks, Code2, Trophy, Flame, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume Analyzer', path: '/resume', icon: FileText },
  { name: 'JD Matcher', path: '/jd-matcher', icon: Target },
  { name: 'Roadmap', path: '/roadmap', icon: Map },
  { name: 'Mock Interview', path: '/interview', icon: Mic },
  { name: 'DSA Recommender', path: '/dsa', icon: ListChecks },
  { name: 'Live Coding', path: '/coding', icon: Code2 },
  { name: 'Rewards', path: '/rewards', icon: Trophy },
];

export default function Sidebar() {
  const { user } = useAuth();
  const streak = user?.streak?.current || 1;
  const best = user?.streak?.best || 1;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-orange-100 flex flex-col justify-between p-4 shrink-0">
      <div>
        <div className="flex items-center gap-3 px-2 mb-7">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white font-bold shadow-sm">↗</div>
          <div>
            <h1 className="font-bold text-lg leading-none">Safal<span className="text-[#FF6B00]">Path</span></h1>
            <p className="text-[10px] tracking-widest text-gray-400 font-semibold mt-1">CAREER COPILOT</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6B00]'
                }`
              }
            >
              <Icon size={18} />
              {name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="bg-[#121622] text-white p-4 rounded-2xl mt-6">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Flame className="text-[#FF6B00] fill-[#FF6B00]" size={18} />
          <span>{streak}-day streak</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 mb-3">Best: {best} days</p>
        <button
          onClick={() => alert('Daily 8:00 PM placement reminder enabled!')}
          className="w-full py-2 px-3 bg-white text-[#121622] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-100"
        >
          <Bell size={14} /> Daily reminders
        </button>
      </div>
    </aside>
  );
}