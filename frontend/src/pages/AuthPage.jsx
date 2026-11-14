import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const { user, syncUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', targetRole: 'Software Engineer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const { data } = await API.post(`/auth/${register ? 'register' : 'login'}`, form); localStorage.setItem('safalpath_token', data.token); localStorage.setItem('safalpath_demo_user', JSON.stringify(data.user)); syncUser(data.user, data.levelInfo); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.error || 'Could not connect. Check your details and try again.'); }
    finally { setLoading(false); }
  };
  return <main className="auth-page"><Link to="/" className="auth-back"><ArrowLeft size={16}/> Back to SafalPath</Link><div className="auth-card"><div className="auth-brand"><BrandLogo/></div><div className="auth-kicker"><Sparkles size={14}/> YOUR NEXT CHAPTER STARTS HERE</div><h1>{register ? 'Build your way forward.' : 'Welcome back.'}</h1><p>{register ? 'A little progress each day adds up to big results.' : 'Pick up where your preparation left off.'}</p>
    <form onSubmit={submit} className="auth-form">{register && <label>Your name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Alex Morgan"/></label>}<label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength={6} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></label>{register && <label>Target role<select value={form.targetRole} onChange={e=>setForm({...form,targetRole:e.target.value})}><option>Software Engineer</option><option>Frontend Developer</option><option>Full Stack Developer</option><option>Data Analyst</option></select></label>}{error && <div className="form-error">{error}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'One moment…' : register ? 'Create your free account' : 'Log in'}<ArrowRight size={17}/></button></form>
    <div className="auth-switch">{register ? 'Already have an account?' : 'New to SafalPath?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></div><div className="auth-note">Your preparation space, ready when you are.</div></div></main>;
}
