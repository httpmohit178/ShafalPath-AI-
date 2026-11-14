import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, FileText, Target, Map, Mic, Code2, BarChart3, X } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, syncUser } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', targetRole: 'SDE' });
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await API.post(endpoint, form);
      localStorage.setItem('safalpath_token', data.token);
      syncUser(data.user, data.levelInfo);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white font-bold">↗</div>
          <div>
            <span className="font-bold text-lg">Safal<span className="text-[#FF6B00]">Path</span></span>
            <p className="text-[10px] tracking-widest text-gray-400">CAREER COPILOT</p>
          </div>
        </div>
        <button
          onClick={() => (user ? navigate('/dashboard') : setShowAuth(true))}
          className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition"
        >
          {user ? 'Go to Dashboard' : 'Sign in'}
        </button>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-12 pb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-100 text-xs font-medium text-gray-600 shadow-sm mb-6">
          <Sparkles size={14} className="text-[#FF6B00]" /> AI Career & Placement Copilot
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1A1D24] leading-tight">
          Your path to <span className="text-[#FF8A00]">placement</span>{' '}
          <span className="text-[#84B026]">success,</span> one week at a time.
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto mt-6 text-base sm:text-lg">
          SafalPath reads your resume, compares it to your dream role and builds a personalized week-wise roadmap — with mock interviews, DSA practice and live coding.
        </p>
        <button
          onClick={() => (user ? navigate('/dashboard') : setShowAuth(true))}
          className="inline-flex items-center gap-2 mt-8 bg-[#FF6B00] text-white px-7 py-3.5 rounded-2xl font-semibold shadow-lg shadow-orange-200 hover:bg-orange-600 transition"
        >
          Get started free <ArrowRight size={18} />
        </button>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: 'AI Resume Analyzer', desc: 'Extracts skills, projects & education. ATS score + missing skills.', icon: FileText },
          { title: 'JD Matcher', desc: 'Match % against any job description with missing keywords.', icon: Target },
          { title: 'Learning Roadmap', desc: 'Skill gaps turned into a week-wise interview plan.', icon: Map },
          { title: 'AI Mock Interview', desc: 'Text or voice, technical & HR — scored on 3 axes.', icon: Mic },
          { title: 'DSA + Live Coding', desc: 'Easy/Medium/Hard picks and an in-browser code runner.', icon: Code2 },
          { title: 'Progress Dashboard', desc: 'Streaks, XP, heatmap and score trends — LeetCode style.', icon: BarChart3 },
        ].map(({ title, desc, icon: Icon }) => (
          <div key={title} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Icon size={20} />
            </div>
            <h3 className="font-bold text-lg text-[#1A1D24]">{title}</h3>
            <p className="text-gray-500 text-sm mt-1">{desc}</p>
          </div>
        ))}
      </section>

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-2xl font-bold mb-1">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p className="text-sm text-gray-500 mb-6">Start your personalized placement prep journey.</p>
            {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-4">{error}</p>}
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <input required placeholder="Full Name (e.g. Yoyo)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                  <input placeholder="Target Role (e.g. SDE, Frontend)" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
                </>
              )}
              <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              <button type="submit" className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-semibold hover:bg-orange-600">
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <p className="text-xs text-center text-gray-500 mt-4">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-[#FF6B00] font-semibold">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}