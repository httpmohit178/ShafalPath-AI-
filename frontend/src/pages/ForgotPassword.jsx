import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { API } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function ForgotPassword() {
  const [params] = useSearchParams(); const token = params.get('token');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setMessage(''); setError('');
    try {
      const { data } = token ? await API.post('/auth/reset-password', { token, password }) : await API.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) { setError(err.response?.data?.error || 'Could not complete the password reset. Try again.'); }
    finally { setLoading(false); }
  };
  return <main className="auth-page"><Link to="/login" className="auth-back"><ArrowLeft size={16}/> Back to login</Link><div className="auth-card"><div className="auth-brand"><BrandLogo/></div><div className="auth-kicker"><Sparkles size={14}/> ACCOUNT RECOVERY</div><h1>{token ? 'Choose a new password.' : 'Reset your password.'}</h1><p>{token ? 'Choose a password with at least six characters.' : 'We’ll email a secure reset link if an account matches.'}</p><form className="auth-form" onSubmit={submit}>{token ? <label>New password<input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"/></label> : <label>Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/></label>}{error && <div className="form-error">{error}</div>}{message && <div className="resume-clear-state" role="status">{message}</div>}<button className="primary-button auth-submit" disabled={loading}>{loading ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}<ArrowRight size={17}/></button></form><div className="auth-switch"><Link to="/login">Return to login</Link></div></div></main>;
}
