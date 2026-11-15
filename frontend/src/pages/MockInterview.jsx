import { useEffect, useRef, useState } from 'react';
import { Award, Camera, CameraOff, CheckCircle2, Clock3, FileText, Loader2, Mic, MicOff, Play, RotateCcw, Send, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';
import { isRepeatedInterviewQuestion, localInterviewReply } from '../lib/localInterview';
import AriaAvatar from '../components/AriaAvatar';

const ROLES = ['Software Development Engineer (SDE)', 'Full Stack MERN Developer', 'Frontend React Developer', 'Backend Node.js Engineer', 'Data Analyst', 'Teacher / Educator', 'Sales Representative', 'Marketing Specialist', 'Human Resources Specialist', 'Customer Support Representative', 'Operations Coordinator', 'Accountant / Finance Associate', 'Healthcare Professional', 'Other / custom role'];
const ROUNDS = ['Role skills & scenarios', 'Experience & projects', 'Behavioral & communication', 'Situational judgment', 'Technical DSA & problem solving', 'Core CS & system design'];
const MAX_QUESTIONS = 5;

export default function MockInterview() {
  const { user, syncUser } = useAuth();
  const initialRole = ROLES.includes(user?.targetRole) ? user.targetRole : 'Other / custom role';
  const [role, setRole] = useState(initialRole); const [round, setRound] = useState(ROUNDS[0]);
  const [customRole, setCustomRole] = useState(initialRole === 'Other / custom role' ? (user?.targetRole || '') : '');
  const [started, setStarted] = useState(false); const [completed, setCompleted] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(300); const timeoutHandled = useRef(false); const timeoutSubmitRef = useRef(null);
  const [messages, setMessages] = useState([]); const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [scores, setScores] = useState([]);
  const [aiMode, setAiMode] = useState('local'); const [transcriptionAvailable, setTranscriptionAvailable] = useState(null); const [micNotice, setMicNotice] = useState('');
  const [cameraOn, setCameraOn] = useState(false); const [recording, setRecording] = useState(false); const [dictating, setDictating] = useState(false); const [transcribing, setTranscribing] = useState(false); const [speaking, setSpeaking] = useState(true);
  const chatEnd = useRef(null); const videoRef = useRef(null); const streamRef = useRef(null); const recorderRef = useRef(null); const audioChunksRef = useRef([]); const recognitionRef = useRef(null); const speechTranscriptRef = useRef(''); const answerBeforeSpeechRef = useRef('');
  const currentQuestion = messages.filter((m) => m.sender === 'ai' && m.questionNumber).length;
  const selectedRole = role === 'Other / custom role' ? (customRole.trim() || 'Professional') : role;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { API.get('/health').then(({ data }) => setTranscriptionAvailable(Boolean(data.aiConfigured))).catch(() => setTranscriptionAvailable(null)); }, []);
  useEffect(() => () => { if (recorderRef.current?.state === 'recording') { recorderRef.current.onstop = null; recorderRef.current.stop(); } streamRef.current?.getTracks().forEach((track) => track.stop()); window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); }, []);
  const say = (text) => { if (!speaking || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.97; window.speechSynthesis.speak(utterance); };

  const startCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); streamRef.current = stream; setCameraOn(true); if (videoRef.current) videoRef.current.srcObject = stream; }
    catch { setError('Camera access was unavailable. Allow camera access in your browser settings, or continue without it.'); }
  };
  useEffect(() => { if (cameraOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [cameraOn, started]);
  const toggleCamera = () => { if (cameraOn) { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraOn(false); } else startCamera(); };
  const startBrowserDictation = ({ fallback = false } = {}) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setMicNotice(''); setError('This browser does not provide speech recognition. Configure GROQ_API_KEY on the backend, use Chrome, or type your answer.'); return; }
    if (dictating) { recognitionRef.current?.stop(); setDictating(false); return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'en-IN'; recognition.interimResults = true; recognition.continuous = true;
    speechTranscriptRef.current = ''; answerBeforeSpeechRef.current = answer.trim();
    recognition.onresult = (event) => {
      speechTranscriptRef.current = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim();
      setAnswer([answerBeforeSpeechRef.current, speechTranscriptRef.current].filter(Boolean).join(' '));
    };
    recognition.onerror = (event) => { setDictating(false); setMicNotice(''); const reason = event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'Allow microphone access in your browser settings, then try again.' : event.error === 'no-speech' ? 'Aria did not hear speech. Check your microphone and try again.' : 'Browser dictation stopped. You can retry or type your answer.'; setError(reason); };
    recognition.onend = () => setDictating(false); recognitionRef.current = recognition;
    try { recognition.start(); setDictating(true); setError(''); setMicNotice(fallback ? 'Groq transcription could not be used. Browser dictation is listening now; please repeat your answer.' : 'Using browser speech recognition; speak naturally, then press the microphone to stop.'); } catch { setDictating(false); setMicNotice(''); setError('Could not start browser dictation. Check microphone permissions and try again.'); }
  };
  const transcribeRecording = async (blob, mimeType) => {
    if (blob.size < 1200) { setError('The recording was too short or silent. Hold the microphone button, speak clearly, then stop it.'); return; }
    setTranscribing(true); setError('');
    try {
      const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const form = new FormData(); form.append('audio', blob, `aria-answer.${extension}`); form.append('language', 'en');
      const { data } = await API.post('/ai/transcribe', form);
      setAnswer((current) => [current.trim(), data.transcript.trim()].filter(Boolean).join(' '));
    } catch (err) {
      const message = err.response?.data?.error || 'Audio transcription failed. Use browser dictation below or type your answer.';
      if (window.SpeechRecognition || window.webkitSpeechRecognition) { setTranscriptionAvailable(false); startBrowserDictation({ fallback: true }); return; }
      setError(message);
    } finally { setTranscribing(false); }
  };
  const toggleMic = async () => {
    if (dictating) { recognitionRef.current?.stop(); setDictating(false); return; }
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    if (transcribing) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (transcriptionAvailable === false && SpeechRecognition) { startBrowserDictation(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { startBrowserDictation(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder; audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) audioChunksRef.current.push(event.data); };
      recorder.onerror = () => { stream.getTracks().forEach((track) => track.stop()); setRecording(false); setError('Microphone recording failed. Check the selected input device and permissions.'); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = []; stream.getTracks().forEach((track) => track.stop()); streamRef.current = null;
        transcribeRecording(blob, recorder.mimeType || 'audio/webm');
      };
      recorder.start(250); setRecording(true); setError('');
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Microphone permission was blocked. Allow access in the browser address bar and try again.' : err.name === 'NotFoundError' ? 'No microphone was found. Connect a microphone or use browser dictation.' : 'Could not open the microphone. Check browser permissions and try again.');
    }
  };

  const startInterview = async () => {
    setLoading(true); setError(''); setMessages([]); setScores([]); setCompleted(false); setQuestionSeconds(300); timeoutHandled.current = false;
    try { const { data } = await API.post('/ai/interview', { role: selectedRole, round, resumeText: user?.resumeText || '', history: [], userAnswer: null }); const question = data.nextQuestion || `For a ${selectedRole} role, what skill, task, or judgment do you consider most important, and why?`; setAiMode(data.mode || 'local'); setMessages([{ sender: 'ai', text: question, questionNumber: 1 }]); setStarted(true); say(question); }
    catch (err) { setError(err.response?.data?.error || 'Could not reach Aria. Check the backend and AI setup.'); }
    finally { setLoading(false); }
  };
  const submitAnswer = async (e, { timedOut = false } = {}) => {
    e?.preventDefault(); if ((!answer.trim() && !timedOut) || loading) return;
    timeoutHandled.current = true;
    const submitted = answer.trim(); const history = [...messages, { sender: 'user', text: submitted || '[No answer submitted before the time limit.]' }]; setMessages(history); setAnswer(''); setLoading(true); setError(''); recognitionRef.current?.stop(); setDictating(false); if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); setRecording(false);
    try {
      const { data } = await API.post('/ai/interview', { role: selectedRole, round, resumeText: user?.resumeText || '', history, userAnswer: submitted, timedOut });
      setAiMode(data.mode || 'local');
      const score = Number.isFinite(data.score) ? data.score : (timedOut ? 1 : 7); const updatedScores = [...scores, score]; setScores(updatedScores);
      const done = updatedScores.length >= MAX_QUESTIONS; let nextQuestion = done ? 'That completes your practice round. Review your feedback and scorecard below.' : (data.nextQuestion || 'What trade-offs did you consider?');
      const previousQuestions = history.filter((message) => message.sender === 'ai' && message.questionNumber).map((message) => message.text);
      if (!done && isRepeatedInterviewQuestion(nextQuestion, previousQuestions)) {
        const localFollowUp = localInterviewReply({ role: selectedRole, round, history, userAnswer: submitted, resumeText: user?.resumeText || '' });
        nextQuestion = localFollowUp.nextQuestion;
        setAiMode(data.mode === 'groq' ? 'mixed' : 'local');
      }
      setMessages((prev) => [...prev, { sender: 'ai', score, feedback: data.feedback || 'Explain the outcome and trade-offs more specifically.', text: nextQuestion, questionNumber: done ? null : updatedScores.length + 1 }]);
      if (!done) { setQuestionSeconds(300); timeoutHandled.current = false; }
      if (done) { setCompleted(true); API.post('/user/interview/complete', { score: Math.round(updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length * 10), role: selectedRole, round }).then(({ data: progress }) => syncUser(progress.user, progress.levelInfo)).catch(() => {}); }
      say(nextQuestion);
    } catch (err) { setError(err.response?.data?.error || 'Could not evaluate that answer. Try sending it again.'); }
    finally { setLoading(false); }
  };
  timeoutSubmitRef.current = () => submitAnswer(undefined, { timedOut: true });
  useEffect(() => {
    if (!started || completed || loading || currentQuestion === 0) return undefined;
    const timer = window.setInterval(() => setQuestionSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, completed, loading, currentQuestion]);
  useEffect(() => {
    if (started && !completed && !loading && questionSeconds === 0 && !timeoutHandled.current) timeoutSubmitRef.current?.();
  }, [started, completed, loading, questionSeconds]);
  const reset = () => { setStarted(false); setCompleted(false); setMessages([]); setScores([]); setAnswer(''); setError(''); window.speechSynthesis?.cancel(); };
  const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : '0.0';

  return <div className="interview-page space-y-6">
    <div className="interview-heading"><div><span className="eyebrow"><Sparkles size={14}/> ARIA · YOUR AI INTERVIEWER</span><h1>Practice out loud. Get better every round.</h1><p>Five adaptive questions, up to five minutes for each answer, spoken prompts and clear feedback.</p></div>{started && <div className="score-chip"><Award size={17}/> {average}<small>/10 avg</small></div>}</div>
    {error && <div className="interview-error">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
    {!started ? <section className="interview-setup theme-card"><div className="aria-profile"><AriaAvatar size={84}/><div><b>Meet Aria</b><p>Your AI interviewer asks role-specific questions. Groq generates questions and feedback when configured; a role-based local question bank keeps practice available if it is offline.</p></div></div>
      <div className="interview-selects"><label>Target role<select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((item) => <option key={item}>{item}</option>)}</select>{role === 'Other / custom role' && <input className="custom-role-input" value={customRole} onChange={(e) => setCustomRole(e.target.value)} placeholder="Type any job title"/>}</label><label>Interview focus<select value={round} onChange={(e) => setRound(e.target.value)}>{ROUNDS.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      <div className="resume-context-note">{user?.resumeText ? <><CheckCircle2 size={15}/> Aria uses your resume only for the Experience &amp; projects round; other rounds focus on your selected role. <Link to="/resume">Update resume</Link></> : <><FileText size={15}/> Resume is optional. Add one if you want resume-based questions in the Experience &amp; projects round. <Link to="/resume">Analyze resume</Link></>}</div>
      <div className="interview-setup-footer"><span><CheckCircle2 size={15}/> Five questions · 5 minutes per answer · voice playback</span><button className="primary-button" disabled={loading} onClick={startInterview}>{loading ? <Loader2 className="animate-spin" size={16}/> : <Play size={16}/>} {loading ? 'Preparing Aria…' : 'Start interview'}</button></div>
    </section> : <section className="interview-room theme-card"><div className="room-bar"><span><i className="live-dot"/> Live practice <small>{selectedRole} · {round}</small><small className={`interview-ai-mode ${aiMode}`}>{aiMode === 'groq' ? 'GROQ AI' : aiMode === 'mixed' ? 'GROQ + LOCAL' : 'LOCAL FALLBACK'}</small></span><div><button className="icon-button" onClick={toggleCamera} title="Toggle your camera">{cameraOn ? <CameraOff size={17}/> : <Camera size={17}/>} {cameraOn ? 'Camera off' : 'Camera on'}</button><button className="icon-button" onClick={() => { setSpeaking(!speaking); window.speechSynthesis?.cancel(); }} title="Toggle Aria voice">{speaking ? <VolumeX size={17}/> : <Volume2 size={17}/>} {speaking ? 'Mute Aria' : 'Hear Aria'}</button><button className="icon-button" onClick={reset}><RotateCcw size={16}/> New round</button></div></div>
      <div className="room-stage"><div className="aria-stage"><AriaAvatar size={124} speaking={loading}/><b>Aria</b><small>{loading ? 'Thinking about your answer…' : speaking ? 'Ready when you are' : 'Voice muted'}</small><div className="audio-wave"><i/><i/><i/><i/><i/></div></div><div className="camera-stage">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline/> : <div className="camera-placeholder"><Camera size={27}/><b>Your camera is off</b><small>Turn it on to practice on camera. Video stays on this device.</small><button className="secondary-button" onClick={toggleCamera}>Enable camera</button></div>}<span>YOU · LOCAL PREVIEW</span></div></div>
      <div className="interview-progress"><div><span>Question {Math.min(currentQuestion, MAX_QUESTIONS)} of {MAX_QUESTIONS}</span><span className={`question-timer ${questionSeconds < 60 && !completed ? 'urgent' : ''}`}><Clock3 size={14}/> {completed ? 'Round complete' : `${Math.floor(questionSeconds / 60).toString().padStart(2, '0')}:${(questionSeconds % 60).toString().padStart(2, '0')} to answer`}</span><span>{Math.round((scores.length / MAX_QUESTIONS) * 100)}% complete</span></div><div><i style={{width:`${Math.max(12, scores.length / MAX_QUESTIONS * 100)}%`}}/></div></div>
      <div className="interview-feed">{messages.map((msg, idx) => <div key={idx} className={`interview-message ${msg.sender}`}><small>{msg.sender === 'ai' ? `ARIA${msg.questionNumber ? ` · QUESTION ${msg.questionNumber}` : ''}` : 'YOU'}</small><p>{msg.text}</p>{msg.feedback && <div className="feedback-box"><b><Sparkles size={14}/> Aria’s feedback <span>{msg.score}/10</span></b><p>{msg.feedback}</p></div>}</div>)}<div ref={chatEnd}/></div>
      {completed ? <div className="interview-complete"><Trophy size={24}/><div><b>Round complete · {average}/10</b><p>XP and your practice score have been added to your profile.</p></div><button className="primary-button" onClick={reset}>Practice again</button></div> : <><form className="answer-form" onSubmit={submitAnswer}><button type="button" onClick={toggleMic} className={`mic-button ${recording || dictating ? 'listening' : ''}`} disabled={transcribing || loading} title={recording ? 'Stop recording and transcribe' : dictating ? 'Stop browser dictation' : 'Record an answer for Aria'} aria-label={recording ? 'Stop recording' : dictating ? 'Stop browser dictation' : 'Record your answer'}>{transcribing ? <Loader2 className="animate-spin" size={19}/> : recording || dictating ? <MicOff size={19}/> : <Mic size={19}/>}</button><textarea rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={recording ? 'Recording… press the microphone again when finished' : transcribing ? 'Aria is transcribing your answer…' : dictating ? 'Browser dictation is listening…' : 'Type your answer, or record it for Aria…'}/><button className="primary-button" type="submit" disabled={loading || transcribing || !answer.trim()}><Send size={16}/> Send answer</button></form>{micNotice && <div className="mic-fallback-notice" role="status">{micNotice}</div>}<div className="mic-privacy-note">{dictating ? 'Microphone speech is being entered by your browser. Press the microphone again to stop.' : recording ? 'Recording stays on while this button is active. Stop it to transcribe.' : transcriptionAvailable === false ? 'Groq transcription is not configured. The microphone uses browser speech recognition when available.' : 'When Groq is configured, recordings are sent to your backend for transcription. Review the transcript before sending.'}{error && !transcribing && <button type="button" className="dictation-fallback" onClick={() => startBrowserDictation()}>Try browser dictation</button>}</div></>}
    </section>}
  </div>;
}
