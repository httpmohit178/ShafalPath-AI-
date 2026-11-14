import { useState } from 'react';
import { Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function Roadmap() {
  const { user, syncUser } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'SDE');
  const [weeks, setWeeks] = useState(user?.roadmap?.weeks || 6);
  const [hoursPerDay, setHoursPerDay] = useState(user?.roadmap?.hoursPerDay || 3);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await API.post('/ai/roadmap', { targetRole, weeks, hoursPerDay });
      syncUser(data.user, data.levelInfo);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (weekIdx, taskIdx) => {
    const { data } = await API.post('/user/roadmap/toggle', { weekIdx, taskIdx });
    syncUser(data.user, data.levelInfo);
  };

  const plan = user?.roadmap?.plan || [];
  const totalTasks = plan.reduce((a, w) => a + w.tasks.length, 0);
  const doneTasks = plan.reduce((a, w) => a + w.tasks.filter((t) => t.completed).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Roadmap</h1>
        <p className="text-sm text-gray-500">Your skill gaps converted into a week-wise study plan before interviews.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Target role</label>
          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold w-40" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Weeks: {weeks}</label>
          <input type="range" min={2} max={12} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="accent-[#FF6B00]" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Hours/day: {hoursPerDay}</label>
          <input type="range" min={1} max={8} value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} className="accent-[#FF6B00]" />
        </div>
        <button onClick={generate} disabled={loading} className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600">
          <Sparkles size={16} /> {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {plan.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center text-sm font-bold">
          <span>{weeks}-Week {targetRole} Interview Preparation Roadmap ({hoursPerDay}hrs/day)</span>
          <span className="text-gray-400">{doneTasks}/{totalTasks} tasks</span>
        </div>
      )}

      <div className="space-y-4">
        {plan.map((week, wIdx) => (
          <div key={wIdx} className="bg-white p-6 rounded-3xl border border-orange-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-[#FF6B00]">WEEK {week.week}</span>
                <h3 className="font-bold text-lg">{week.title}</h3>
                <p className="text-xs text-gray-500">{week.subtitle}</p>
              </div>
              <span className="text-xs text-gray-400">{week.tasks.filter((t) => t.completed).length}/{week.tasks.length}</span>
            </div>
            <div className="space-y-3">
              {week.tasks.map((task, tIdx) => (
                <div key={tIdx} onClick={() => toggleTask(wIdx, tIdx)} className="flex items-start gap-3 cursor-pointer p-2 rounded-xl hover:bg-orange-50/40">
                  {task.completed ? <CheckCircle2 className="text-[#FF6B00] shrink-0 mt-0.5" size={20} /> : <Circle className="text-orange-300 shrink-0 mt-0.5" size={20} />}
                  <div>
                    <p className={`text-sm font-semibold ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                    <p className="text-xs text-gray-400">{task.type} · {task.hours} · {task.resource}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}