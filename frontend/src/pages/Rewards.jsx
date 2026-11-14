import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Circle, Crown } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

const ALL_BADGES = [
  { name: 'Resume Ready', desc: 'Analyze your resume' },
  { name: 'ATS Ace', desc: 'Reach ATS score 80+' },
  { name: 'Job Hunter', desc: 'Match 3 job descriptions' },
  { name: 'Planner', desc: 'Complete 10 roadmap tasks' },
  { name: 'First Interview', desc: 'Finish a mock interview' },
  { name: 'Smooth Talker', desc: 'Score 80+ in an interview' },
  { name: 'DSA Grinder', desc: 'Solve 10 DSA problems' },
  { name: 'All Green', desc: 'Pass all tests in live coding' },
];

export default function Rewards() {
  const { user, levelInfo } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    API.get('/user/leaderboard').then((res) => setLeaderboard(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rewards & Achievements</h1>
        <p className="text-sm text-gray-500">Earn XP, level up, unlock badges and climb the leaderboard.</p>
      </div>

      <div className="bg-gradient-to-r from-[#1A1612] via-[#3A2818] to-[#1A1612] text-white p-8 rounded-3xl">
        <p className="text-xs tracking-widest text-amber-300 font-bold">LEVEL {levelInfo.level}</p>
        <h2 className="text-3xl font-extrabold mt-1">{levelInfo.title}</h2>
        <p className="text-xs text-gray-300 mt-1">{user?.xp || 40} XP · {levelInfo.xpToNext} XP to level {levelInfo.level + 1}</p>
        <div className="w-full max-w-md h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-[#FF6B00]" style={{ width: `${levelInfo.progressPercent}%` }} />
        </div>
        <div className="flex gap-4 text-xs mt-4">
          <span>🔥 {user?.streak?.current || 1} day streak</span>
          <span>🏅 {user?.badges?.length || 1}/12 badges</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100">
        <h3 className="font-bold text-sm mb-4">Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ALL_BADGES.map((b) => {
            const unlocked = user?.badges?.includes(b.name);
            return (
              <div key={b.name} className={`p-4 rounded-2xl border text-center ${unlocked ? 'border-orange-300 bg-orange-50/40' : 'border-gray-100 opacity-60'}`}>
                <Award className={`mx-auto mb-2 ${unlocked ? 'text-[#FF6B00]' : 'text-gray-400'}`} size={26} />
                <h4 className="font-bold text-xs">{b.name}</h4>
                <p className="text-[11px] text-gray-500 mt-1">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-3">
        <h3 className="font-bold text-sm">Daily quests</h3>
        {[
          { label: 'Solve a DSA problem', xp: '+15', done: user?.dailyQuests?.dsaDone },
          { label: 'Take a mock interview', xp: '+40', done: user?.dailyQuests?.interviewDone },
          { label: 'Submit a live coding solution', xp: '+40', done: user?.dailyQuests?.codingDone },
        ].map((q) => (
          <div key={q.label} className={`flex justify-between items-center p-3 rounded-xl ${q.done ? 'bg-[#FAF8F5] text-gray-400 line-through' : ''}`}>
            <div className="flex items-center gap-3 text-sm font-medium">
              {q.done ? <CheckCircle2 className="text-emerald-600" size={18} /> : <Circle className="text-gray-400" size={18} />}
              {q.label}
            </div>
            <span className="text-xs font-bold text-[#FF6B00]">{q.xp}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-2">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><Crown size={16} className="text-[#FF6B00]" /> Leaderboard</h3>
        {leaderboard.map((u, idx) => (
          <div key={u._id} className={`flex justify-between items-center p-3 rounded-xl text-sm ${u._id === user?._id ? 'bg-orange-50 font-bold' : ''}`}>
            <span>#{idx + 1} {u.name} {u._id === user?._id && '(you)'}</span>
            <span className="text-xs font-semibold">🔥 {u.streak?.current || 1} &nbsp; {u.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}