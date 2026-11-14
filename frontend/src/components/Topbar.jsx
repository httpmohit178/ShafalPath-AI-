import { LogOut, Flame, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, levelInfo, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 px-8 border-b border-orange-100/70 flex items-center justify-between bg-[#FAF8F5]">
      <p className="text-sm font-medium text-gray-700">
        Namaste, <span className="font-bold text-[#1A1D24]">{user?.name || 'Student'}</span> 👋
      </p>
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-orange-100 text-[#FF6B00] text-xs font-bold flex items-center gap-1">
          <Flame size={14} className="fill-[#FF6B00]" /> {user?.streak?.current || 1}
        </span>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
          <Zap size={14} /> Lv {levelInfo.level} · {levelInfo.title}
        </span>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="text-xs font-medium text-gray-600 hover:text-red-600 flex items-center gap-1 ml-2"
        >
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}