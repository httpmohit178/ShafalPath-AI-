import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, LockKeyhole, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

const BANK = {
  'JavaScript': [
    { q: 'What does Array.prototype.map() return?', options: ['A new array', 'The original array only', 'A number', 'A promise'], answer: 0, why: 'map creates a new array from each callback result.' },
    { q: 'Which declaration cannot be reassigned?', options: ['var', 'let', 'const', 'function'], answer: 2, why: 'A const binding cannot be reassigned.' },
    { q: 'What is typeof null in JavaScript?', options: ['null', 'undefined', 'object', 'number'], answer: 2, why: 'This is a long-standing JavaScript behavior.' },
    { q: 'Which method turns JSON text into a value?', options: ['JSON.stringify', 'JSON.parse', 'Object.fromEntries', 'Array.from'], answer: 1, why: 'JSON.parse reads JSON text into a JavaScript value.' },
    { q: 'What does Promise.all do when one promise rejects?', options: ['Waits forever', 'Rejects with that failure', 'Returns null', 'Retries automatically'], answer: 1, why: 'Promise.all rejects as soon as an input promise rejects.' },
  ],
  'React': [
    { q: 'Which hook stores component state?', options: ['useMemo', 'useState', 'useEffect', 'useRef'], answer: 1, why: 'useState stores state and provides a setter.' },
    { q: 'Why should list items have stable keys?', options: ['To style them', 'To help React match items between renders', 'To sort them', 'To avoid hooks'], answer: 1, why: 'Keys help React identify items when a list changes.' },
    { q: 'When does an effect with [] dependencies normally run?', options: ['After every render', 'After the initial mount', 'Before render', 'Never'], answer: 1, why: 'An empty dependency list runs the effect after mount.' },
    { q: 'What should a controlled input use?', options: ['value and onChange', 'Only defaultValue', 'Only a ref', 'innerHTML'], answer: 0, why: 'React state supplies value and onChange updates that state.' },
    { q: 'What does a React state setter do?', options: ['Mutates state immediately', 'Schedules a render with the new state', 'Reloads the page', 'Changes props'], answer: 1, why: 'State updates cause React to render with the updated value.' },
  ],
  'Web fundamentals': [
    { q: 'Which HTTP method is generally used to retrieve a resource?', options: ['POST', 'GET', 'PATCH', 'DELETE'], answer: 1, why: 'GET requests representation of a resource.' },
    { q: 'What does CSS flex-wrap: wrap allow?', options: ['Items to move onto another line', 'Text to become bold', 'A grid to become fixed', 'Elements to overlap'], answer: 0, why: 'Flex items can wrap onto additional lines when needed.' },
    { q: 'Which status code means a request succeeded?', options: ['301', '403', '200', '500'], answer: 2, why: '200 is the standard OK success status.' },
    { q: 'What does HTTPS add to HTTP?', options: ['Encryption in transit', 'Faster JavaScript', 'A database', 'Image compression'], answer: 0, why: 'HTTPS protects transport using TLS encryption.' },
    { q: 'Which HTML element is best for the main page content?', options: ['<main>', '<span>', '<b>', '<small>'], answer: 0, why: '<main> identifies the dominant content of a document.' },
  ],
};
const CATEGORIES = Object.keys(BANK);
const DURATION = 10 * 60;
const prettyTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export default function Assessment() {
  const [category, setCategory] = useState(CATEGORIES[0]); const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({}); const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(DURATION); const [warnings, setWarnings] = useState(0); const [finished, setFinished] = useState(false); const [fullscreenActive, setFullscreenActive] = useState(false);
  const questions = useMemo(() => BANK[category], [category]);
  const finish = useCallback(() => { setFinished(true); setStarted(false); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, []);
  useEffect(() => { if (!started || finished) return undefined; const id = setInterval(() => setSeconds((n) => { if (n <= 1) { clearInterval(id); setTimeout(finish, 0); return 0; } return n - 1; }), 1000); return () => clearInterval(id); }, [started, finished, finish]);
  useEffect(() => {
    if (!started || finished) return undefined;
    const warn = () => setWarnings((count) => { const next = count + 1; if (next >= 3) setTimeout(finish, 0); return next; });
    const visibility = () => { if (document.hidden) warn(); };
    const fullscreen = () => { const active = Boolean(document.fullscreenElement); setFullscreenActive(active); if (!active && started) warn(); };
    const guard = (event) => { event.preventDefault(); };
    const keys = (event) => { if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x', 'p'].includes(event.key.toLowerCase())) guard(event); };
    document.addEventListener('visibilitychange', visibility); document.addEventListener('fullscreenchange', fullscreen);
    document.addEventListener('copy', guard); document.addEventListener('cut', guard); document.addEventListener('paste', guard);
    document.addEventListener('contextmenu', guard); document.addEventListener('keydown', keys);
    return () => { document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', fullscreen); document.removeEventListener('copy', guard); document.removeEventListener('cut', guard); document.removeEventListener('paste', guard); document.removeEventListener('contextmenu', guard); document.removeEventListener('keydown', keys); };
  }, [started, finished, finish]);
  const begin = async () => { setAnswers({}); setCurrent(0); setSeconds(DURATION); setWarnings(0); setFinished(false); setStarted(true); try { await document.documentElement.requestFullscreen?.(); setFullscreenActive(Boolean(document.fullscreenElement)); } catch { setFullscreenActive(false); /* Some browser environments disallow fullscreen. */ } };
  const score = questions.reduce((sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0), 0);
  const percent = Math.round(score / questions.length * 100);

  return <div className="assessment-page space-y-6">
    <div><span className="eyebrow"><ShieldCheck size={14}/> SAFALPATH ASSESSMENTS</span><h1 className="page-title">A focused skills check.</h1><p className="page-subtitle">Timed questions, clear explanations, and a protected session to help you practise under assessment conditions.</p></div>
    {!started && !finished && <section className="assessment-intro theme-card"><div className="assessment-lock-icon"><LockKeyhole size={23}/></div><div className="assessment-intro-copy"><h2>Start a 10-minute assessment</h2><p>Choose a topic. You’ll answer five questions, one at a time, then see your score and explanations.</p></div><label>Assessment topic<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><ul className="assessment-rules"><li><Clock3 size={15}/> 10-minute countdown</li><li><ShieldCheck size={15}/> Fullscreen with focus warnings</li><li><AlertTriangle size={15}/> 3 focus changes end the attempt</li></ul><button className="primary-button" onClick={begin}><Sparkles size={16}/> Begin assessment</button><small className="assessment-disclaimer">Focus controls discourage switching and clipboard use. A browser cannot prevent outside-device assistance or guarantee secure proctoring.</small></section>}
    {started && <section className="assessment-room theme-card" onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()}><header className="assessment-room-header"><span><LockKeyhole size={16}/> {fullscreenActive ? 'Protected · Fullscreen' : 'Protected · Windowed'} · {category}</span><div className="assessment-header-actions">{!fullscreenActive && <button onClick={async () => { try { await document.documentElement.requestFullscreen?.(); setFullscreenActive(Boolean(document.fullscreenElement)); } catch { setFullscreenActive(false); } }}>Enter fullscreen</button>}<b className={seconds < 60 ? 'urgent' : ''}><Clock3 size={16}/> {prettyTime(seconds)}</b></div></header><div className="assessment-progress"><span>Question {current + 1} of {questions.length}</span><div><i style={{width:`${(current + 1) / questions.length * 100}%`}}/></div></div>{warnings > 0 && <p className="assessment-warning"><AlertTriangle size={15}/> Focus warning {warnings} of 3. Returning to the assessment now is recorded.</p>}<article className="assessment-question"><span>QUESTION {String(current + 1).padStart(2, '0')}</span><h2>{questions[current].q}</h2><div className="assessment-options">{questions[current].options.map((option, index) => <button key={option} onClick={() => setAnswers((a) => ({...a, [current]: index}))} className={answers[current] === index ? 'selected' : ''}><i>{String.fromCharCode(65 + index)}</i>{option}</button>)}</div></article><footer className="assessment-controls"><button className="secondary-button" disabled={!current} onClick={() => setCurrent((n) => n - 1)}><ArrowLeft size={15}/> Previous</button><span>{Object.keys(answers).length} answered · {warnings} focus warning{warnings === 1 ? '' : 's'}</span>{current < questions.length - 1 ? <button className="primary-button" onClick={() => setCurrent((n) => n + 1)}>Next question <ArrowRight size={15}/></button> : <button className="primary-button" onClick={finish}>Submit assessment <CheckCircle2 size={15}/></button>}</footer></section>}
    {finished && <section className="assessment-results theme-card"><div className="assessment-result-icon"><Trophy size={28}/></div><span className="eyebrow">ASSESSMENT COMPLETE</span><h2>{percent >= 80 ? 'Strong work.' : 'Good practice.'}</h2><p>You scored <b>{score} of {questions.length}</b> in {category}. {warnings ? `${warnings} focus warning${warnings === 1 ? '' : 's'} recorded.` : 'No focus changes recorded.'}</p><div className="assessment-review">{questions.map((item, index) => <article key={item.q} className={answers[index] === item.answer ? 'correct' : 'incorrect'}><b>{index + 1}. {item.q}</b><p><CheckCircle2 size={14}/> Correct answer: {item.options[item.answer]}</p><small>{item.why}</small></article>)}</div><button className="primary-button" onClick={() => { setFinished(false); setCategory(CATEGORIES[(CATEGORIES.indexOf(category) + 1) % CATEGORIES.length]); }}>Try another topic <ArrowRight size={15}/></button></section>}
  </div>;
}
