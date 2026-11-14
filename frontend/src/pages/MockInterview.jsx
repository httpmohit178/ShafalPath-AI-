import { useEffect, useRef, useState } from 'react';
import { Award, Camera, CameraOff, CheckCircle2, FileText, Loader2, Mic, MicOff, Play, RotateCcw, Send, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';

const ROLES = ['Software Development Engineer (SDE)', 'Full Stack MERN Developer', 'Frontend React Developer', 'Backend Node.js Engineer', 'Data Analyst', 'Teacher / Educator', 'Sales Representative', 'Marketing Specialist', 'Human Resources Specialist', 'Customer Support Representative', 'Operations Coordinator', 'Accountant / Finance Associate', 'Healthcare Professional', 'Other / custom role'];
const ROUNDS = ['Role skills & scenarios', 'Experience & projects', 'Behavioral & communication', 'Situational judgment', 'Technical DSA & problem solving', 'Core CS & system design'];
const MAX_QUESTIONS = 5;

export default function MockInterview() {
  const { user, syncUser } = useAuth();
  const initialRole = ROLES.includes(user?.targetRole) ? user.targetRole : 'Other / custom role';
  const [role, setRole] = useState(initialRole); const [round, setRound] = useState(ROUNDS[0]);
  const [customRole, setCustomRole] = useState(initialRole === 'Other / custom role' ? (user?.targetRole || '') : '');
  const [started, setStarted] = useState(false); const [completed, setCompleted] = useState(false);
  const [messages, setMessages] = useState([]); const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [scores, setScores] = useState([]);
  const [cameraOn, setCameraOn] = useState(false); const [listening, setListening] = useState(false); const [speaking, setSpeaking] = useState(true);
  const chatEnd = useRef(null); const videoRef = useRef(null); const streamRef = useRef(null); const recognitionRef = useRef(null);
  const currentQuestion = messages.filter((m) => m.sender === 'ai' && m.questionNumber).length;
  const selectedRole = role === 'Other / custom role' ? (customRole.trim() || 'Professional') : role;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); }, []);
  const say = (text) => { if (!speaking || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.97; window.speechSynthesis.speak(utterance); };

  const startCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); streamRef.current = stream; setCameraOn(true); if (videoRef.current) videoRef.current.srcObject = stream; }
    catch { setError('Camera access was unavailable. Allow camera access in your browser settings, or continue without it.'); }
  };
  useEffect(() => { if (cameraOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [cameraOn, started]);
  const toggleCamera = () => { if (cameraOn) { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraOn(false); } else startCamera(); };
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Speech recognition is not supported in this browser. Type your answer below instead.'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'en-IN'; recognition.interimResults = true; recognition.continuous = true;
    recognition.onresult = (event) => setAnswer(Array.from(event.results).map((result) => result[0].transcript).join(' '));
    recognition.onerror = () => { setListening(false); setError('Microphone input stopped. You can continue by typing your answer.'); };
    recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start(); setListening(true);
  };

  const startInterview = async () => {
    setLoading(true); setError(''); setMessages([]); setScores([]); setCompleted(false);
    try { const { data } = await API.post('/ai/interview', { role: selectedRole, round, resumeText: user?.resumeText || '', history: [], userAnswer: null }); const question = data.nextQuestion || 'Tell me about a piece of work you are proud of.'; setMessages([{ sender: 'ai', text: question, questionNumber: 1 }]); setStarted(true); say(question); }
    catch (err) { setError(err.response?.data?.error || 'Could not reach Aria. Check the backend and AI setup.'); }
    finally { setLoading(false); }
  };
  const submitAnswer = async (e) => {
    e.preventDefault(); if (!answer.trim() || loading) return;
    const submitted = answer.trim(); const history = [...messages, { sender: 'user', text: submitted }]; setMessages(history); setAnswer(''); setLoading(true); setError(''); recognitionRef.current?.stop(); setListening(false);
    try {
      const { data } = await API.post('/ai/interview', { role: selectedRole, round, resumeText: user?.resumeText || '', history, userAnswer: submitted });
      const score = Number.isFinite(data.score) ? data.score : 7; const updatedScores = [...scores, score]; setScores(updatedScores);
      const done = updatedScores.length >= MAX_QUESTIONS; const nextQuestion = done ? 'That completes your practice round. Review your feedback and scorecard below.' : (data.nextQuestion || 'What trade-offs did you consider?');
      setMessages((prev) => [...prev, { sender: 'ai', score, feedback: data.feedback || 'Explain the outcome and trade-offs more specifically.', text: nextQuestion, questionNumber: done ? null : updatedScores.length + 1 }]);
      if (done) { setCompleted(true); API.post('/user/interview/complete', { score: Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length * 10), role: selectedRole, round }).then(({ data: progress }) => syncUser(progress.user, progress.levelInfo)).catch(() => {}); }
      say(nextQuestion);
    } catch (err) { setError(err.response?.data?.error || 'Could not evaluate that answer. Try sending it again.'); }
    finally { setLoading(false); }
  };
  const reset = () => { setStarted(false); setCompleted(false); setMessages([]); setScores([]); setAnswer(''); setError(''); window.speechSynthesis?.cancel(); };
  const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : '0.0';

  return <div className="interview-page space-y-6">
    <div className="interview-heading"><div><span className="eyebrow"><Sparkles size={14}/> ARIA · YOUR AI INTERVIEWER</span><h1>Practice out loud. Get better every round.</h1><p>Five adaptive questions, spoken prompts and clear feedback for your next interview.</p></div>{started && <div className="score-chip"><Award size={17}/> {average}<small>/10 avg</small></div>}</div>
    {error && <div className="interview-error">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
    {!started ? <section className="interview-setup theme-card"><div className="aria-profile"><div className="aria-avatar" aria-label="Animated AI interviewer Aria"><span className="aria-hair"/><span className="aria-eyes"><i/><i/></span><span className="aria-smile"/><span className="aria-glow"/></div><div><b>Meet Aria</b><p>Your animated AI interviewer. Turn on your camera and microphone in the room whenever you’re ready.</p></div></div>
      <div className="interview-selects"><label>Target role<select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((item) => <option key={item}>{item}</option>)}</select>{role === 'Other / custom role' && <input className="custom-role-input" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Type any job title"/>}</label><label>Interview focus<select value={round} onChange={(e) => setRound(e.target.value)}>{ROUNDS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="resume-context-note">{user?.resumeText ? <><CheckCircle2 size={15}/> Aria will personalize questions using your saved resume. <Link to="/resume">Update resume</Link></> : <><FileText size={15}/> Add a resume to personalize your questions. <Link to="/resume">Analyze resume</Link></>}</div>
      <div className="interview-setup-footer"><span><CheckCircle2 size={15}/> Five questions · voice playback · instant feedback</span><button className="primary-button" disabled={loading} onClick={startInterview}>{loading ? <Loader2 className="animate-spin" size={16}/> : <Play size={16}/>} {loading ? 'Preparing Aria…' : 'Start interview'}</button></div>
    </section> : <section className="interview-room theme-card"><div className="room-bar"><span><i className="live-dot"/> Live practice <small>{selectedRole} · {round}</small></span><div><button className="icon-button" onClick={toggleCamera} title="Toggle your camera">{cameraOn ? <CameraOff size={17}/> : <Camera size={17}/>} {cameraOn ? 'Camera off' : 'Camera on'}</button><button className="icon-button" onClick={() => { setSpeaking(!speaking); window.speechSynthesis?.cancel(); }} title="Toggle Aria voice">{speaking ? <VolumeX size={17}/> : <Volume2 size={17}/>} {speaking ? 'Mute Aria' : 'Hear Aria'}</button><button className="icon-button" onClick={reset}><RotateCcw size={16}/> New round</button></div></div>
      <div className="room-stage"><div className="aria-stage"><div className={`aria-avatar large ${loading ? 'is-speaking' : ''}`}><span className="aria-hair"/><span className="aria-eyes"><i/><i/></span><span className="aria-smile"/><span className="aria-glow"/></div><b>Aria</b><small>{loading ? 'Thinking about your answer…' : speaking ? 'Ready when you are' : 'Voice muted'}</small><div className="audio-wave"><i/><i/><i/><i/><i/></div></div><div className="camera-stage">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline/> : <div className="camera-placeholder"><Camera size={27}/><b>Your camera is off</b><small>Turn it on to practice on camera. Video stays on this device.</small><button className="secondary-button" onClick={toggleCamera}>Enable camera</button></div>}<span>YOU · LOCAL PREVIEW</span></div></div>
      <div className="interview-progress"><div><span>Question {Math.min(currentQuestion, MAX_QUESTIONS)} of {MAX_QUESTIONS}</span><span>{Math.round((scores.length / MAX_QUESTIONS) * 100)}% complete</span></div><div><i style={{width:`${Math.max(12, scores.length / MAX_QUESTIONS * 100)}%`}}/></div></div>
      <div className="interview-feed">{messages.map((msg, idx) => <div key={idx} className={`interview-message ${msg.sender}`}><small>{msg.sender === 'ai' ? `ARIA${msg.questionNumber ? ` · QUESTION ${msg.questionNumber}` : ''}` : 'YOU'}</small><p>{msg.text}</p>{msg.feedback && <div className="feedback-box"><b><Sparkles size={14}/> Aria’s feedback <span>{msg.score}/10</span></b><p>{msg.feedback}</p></div>}</div>)}<div ref={chatEnd}/></div>
      {completed ? <div className="interview-complete"><Trophy size={24}/><div><b>Round complete · {average}/10</b><p>XP and your practice score have been added to your profile.</p></div><button className="primary-button" onClick={reset}>Practice again</button></div> : <form className="answer-form" onSubmit={submitAnswer}><button type="button" onClick={toggleMic} className={`mic-button ${listening ? 'listening' : ''}`} title="Dictate answer">{listening ? <MicOff size={19}/> : <Mic size={19}/>}</button><textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={listening ? 'Listening… speak your answer' : 'Type or dictate your answer…'}/><button className="primary-button" type="submit" disabled={loading || !answer.trim()}><Send size={16}/> Send answer</button></form>}
    </section>}
  </div>;
}
