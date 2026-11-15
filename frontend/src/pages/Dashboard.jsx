import { Link } from 'react-router-dom';
import { Flame, Zap, ListChecks, Map, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
import AriaAvatar from '../components/AriaAvatar';

export default function Dashboard() {
  const { user, levelInfo } = useAuth();
  const totalTasks = user?.roadmap?.plan?.reduce((acc, w) => acc + w.tasks.length, 0) || 0;
  const doneTasks = user?.roadmap?.plan?.reduce((acc, w) => acc + w.tasks.filter((t) => t.completed).length, 0) || 0;
  const roadmapPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const trendData = user?.interviewHistory?.length
    ? user.interviewHistory.map((item, idx) => ({ name: `#${idx + 1}`, score: item.score }))
    : [{ name: '#1', score: 0 }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress Dashboard</h1>
          <p className="text-sm text-gray-500">Start by analyzing your resume to personalize everything.</p>
        </div>
        <Link to="/resume" className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600">
          Analyze resume
        </Link>
      </div>

      <Link to="/interview" className="aria-dashboard-card"><AriaAvatar size={84}/><div><span className="aria-dashboard-kicker"><Sparkles size={13}/> PRACTICE WITH ARIA</span><h2>Ready for a quick interview round?</h2><p>Get five role-specific questions and actionable feedback. Local practice works even when AI is offline.</p></div><span className="aria-dashboard-cta">Start practice →</span></Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Current streak</p>
            <h2 className="text-2xl font-bold mt-1">{user?.streak?.current || 1} days</h2>
            <p className="text-xs text-gray-400 mt-1">Best {user?.streak?.best || 1}</p>
          </div>
          <Flame className="text-[#FF6B00]" size={20} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Level {levelInfo.level}</p>
            <h2 className="text-2xl font-bold mt-1">{user?.xp || 40} XP</h2>
            <p className="text-xs text-gray-400 mt-1">{Math.round(levelInfo.progressPercent)}% to next</p>
          </div>
          <Zap className="text-[#FF6B00]" size={20} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-orange-200 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">DSA solved</p>
            <h2 className="text-2xl font-bold mt-1">{user?.dsaSolved?.length || 0}</h2>
            <p className="text-xs text-gray-400 mt-1">recommended problems</p>
          </div>
          <ListChecks className="text-[#FF6B00]" size={20} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Roadmap</p>
            <h2 className="text-2xl font-bold mt-1">{roadmapPct}%</h2>
            <p className="text-xs text-gray-400 mt-1">{totalTasks ? `${doneTasks}/${totalTasks} tasks` : 'Not created'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm">{user?.activityLog?.length || 1} activities in the last 5 months</h3>
          <span className="text-xs text-[#FF6B00] font-semibold">🔥 {user?.streak?.current || 1} day streak</span>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto">
          {Array.from({ length: 140 }).map((_, i) => (
            <div key={i} className={`w-3.5 h-3.5 rounded-sm ${i >= 140 - (user?.activityLog?.length || 1) ? 'bg-orange-400' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-sm mb-4">Interview score trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Trophy size={16} className="text-[#FF6B00]" /> Recent activity</h3>
        <div className="space-y-2">
          {(user?.activityLog || []).slice(0, 5).map((act, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span>{act.title}</span>
              <span className="text-gray-400 text-xs">{act.score} · {act.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
