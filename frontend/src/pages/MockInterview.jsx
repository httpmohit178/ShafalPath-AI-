import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Send,
  Sparkles,
  Award,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Layers,
  Loader2,
  Trophy,
} from 'lucide-react';
import API from '../context/AuthContext';

const ROLES = [
  'Software Development Engineer (SDE)',
  'Full Stack MERN Developer',
  'Frontend React Developer',
  'Backend Node.js Engineer',
  'Data Analyst',
];

const ROUNDS = [
  'Technical DSA & Problem Solving',
  'Core CS (OS, DBMS, CN, OOPS)',
  'System Design & Architecture',
  'HR & Behavioral Round',
];

export default function MockInterview() {
  const [role, setRole] = useState(ROLES[0]);
  const [round, setRound] = useState(ROUNDS[0]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scores, setScores] = useState([]);
  const chatEndRef = useRef(null);

  const MAX_QUESTIONS = 5;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startInterview = async () => {
    setLoading(true);
    setError('');
    setMessages([]);
    setScores([]);
    setCompleted(false);

    try {
      const res = await API.post('/ai/interview', {
        role,
        round,
        history: [],
        userAnswer: null,
      });

      const firstQuestion =
        res.data?.nextQuestion ||
        `Welcome! Let's begin your ${round} interview for ${role}. Tell me briefly about your strongest technical project and the architecture decisions behind it.`;

      setMessages([
        {
          sender: 'ai',
          text: firstQuestion,
          questionNumber: 1,
        },
      ]);
      setStarted(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to start AI Mock Interviewer. Check your backend connection and GEMINI_API_KEY.'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim() || loading) return;

    const currentAnswer = answer.trim();
    const updatedHistory = [...messages, { sender: 'user', text: currentAnswer }];
    setMessages(updatedHistory);
    setAnswer('');
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/ai/interview', {
        role,
        round,
        history: updatedHistory,
        userAnswer: currentAnswer,
      });

      const score = typeof res.data?.score === 'number' ? res.data.score : 7;
      const feedback =
        res.data?.feedback ||
        'Solid explanation. Try structuring your response with concrete time/space trade-offs.';
      const nextQuestion = res.data?.nextQuestion;

      const updatedScores = [...scores, score];
      setScores(updatedScores);

      const isFinal = updatedScores.length >= MAX_QUESTIONS;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          score,
          feedback,
          text: isFinal
            ? 'That wraps up all 5 questions! Review your final scorecard below.'
            : nextQuestion || 'Walk me through how you handle edge cases and scale bottlenecks.',
          questionNumber: isFinal ? null : updatedScores.length + 1,
        },
      ]);

      if (isFinal) {
        setCompleted(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to evaluate your response. Please try submitting again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setStarted(false);
    setCompleted(false);
    setMessages([]);
    setScores([]);
    setAnswer('');
    setError('');
  };

  const averageScore =
    scores.length > 0
      ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)
      : '0.0';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">AI Mock Interviewer</h1>
            <p className="text-xs opacity-70">
              Adaptive 5-question technical & behavioral rounds with instant 10-point scoring
            </p>
          </div>
        </div>

        {started && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl border theme-card text-xs font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              <span>
                Avg Score: <span className="text-orange-500">{averageScore}/10</span>
              </span>
            </div>
            <button
              onClick={resetSession}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border theme-card text-xs font-semibold hover:border-orange-500 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Session
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Setup Screen */}
      {!started ? (
        <div className="p-8 rounded-3xl border theme-card shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Configure Your Interview Round</h2>
            <p className="text-xs opacity-70">
              Select your target role and round focus. Margdarshak AI will adapt follow-up questions based on your answers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-75">
                <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3.5 rounded-2xl border theme-card text-sm font-medium focus:outline-none focus:border-orange-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-75">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                Interview Round
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full p-3.5 rounded-2xl border theme-card text-sm font-medium focus:outline-none focus:border-orange-500"
              >
                {ROUNDS.map((rnd) => (
                  <option key={rnd} value={rnd}>
                    {rnd}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 text-xs opacity-75">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 Adaptive Questions
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" /> Instant Feedback & Score
              </span>
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md transition hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing Interviewer...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Mock Interview
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Live Interview Room */
        <div className="rounded-3xl border theme-card shadow-sm overflow-hidden flex flex-col">
          {/* Room Banner */}
          <div className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{role}</span>
              <span className="opacity-40">•</span>
              <span className="text-orange-500">{round}</span>
            </div>
            <span className="font-semibold opacity-70">
              Progress: {Math.min(scores.length + (completed ? 0 : 1), MAX_QUESTIONS)} / {MAX_QUESTIONS} Questions
            </span>
          </div>

          {/* Conversation Feed */}
          <div className="p-6 space-y-5 max-h-[470px] overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                } space-y-2`}
              >
                {msg.sender === 'ai' && msg.feedback && (
                  <div className="max-w-2xl p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Interviewer Feedback
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20">
                        Score: {msg.score}/10
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{msg.feedback}</p>
                  </div>
                )}

                <div
                  className={`max-w-2xl px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white font-medium shadow-sm'
                      : 'border theme-card shadow-xs'
                  }`}
                >
                  {msg.sender === 'ai' && msg.questionNumber && (
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-orange-500 mb-1">
                      Question {msg.questionNumber} of {MAX_QUESTIONS}
                    </span>
                  )}
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-medium opacity-70">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Interviewer is evaluating your answer...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Final Scorecard or Answer Box */}
          {completed ? (
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-orange-500/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">
                    Interview Completed! Final Score: {averageScore} / 10
                  </h3>
                  <p className="text-xs opacity-75">
                    {Number(averageScore) >= 7.5
                      ? 'Strong hire signal! Your explanations were structured and clear.'
                      : 'Good practice run! Focus on deeper edge-case and complexity analysis.'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetSession}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Practice Another Round
              </button>
            </div>
          ) : (
            <form
              onSubmit={submitAnswer}
              className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-end gap-3"
            >
              <textarea
                rows={2}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitAnswer(e);
                  }
                }}
                placeholder="Type your interview answer here... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 p-3.5 rounded-2xl border theme-card text-sm focus:outline-none focus:border-orange-500 resize-none"
              />
              <button
                type="submit"
                disabled={loading || !answer.trim()}
                className="px-5 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}