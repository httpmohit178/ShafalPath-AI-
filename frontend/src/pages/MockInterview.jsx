import { useState, useRef } from 'react';
import { Mic, Volume2, Send, Flag } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function MockInterview() {
  const { syncUser } = useAuth();
  const [roundType, setRoundType] = useState('Technical');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [input, setInput] = useState('');
  const [handsFree, setHandsFree] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [report, setReport] = useState(null);
  const recognitionRef = useRef(null);

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (handsFree) startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const startInterview = async () => {
    setReport(null);
    const { data } = await API.post('/ai/interview', { action: 'start', roundType });
    setQuestions(data.questions);
    setAnswers([]);
    setCurrentIdx(0);
    setStarted(true);
    speakText(data.questions[0]);
  };

  const submitAnswer = async () => {
    if (!input.trim()) return;
    const updated = [...answers, { question: questions[currentIdx], answer: input }];
    setAnswers(updated);
    setInput('');

    if (currentIdx + 1 < questions.length) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      speakText(questions[next]);
    } else {
      finishInterview(updated);
    }
  };

  const finishInterview = async (finalAnswers = answers) => {
    window.speechSynthesis.cancel();
    const { data } = await API.post('/ai/interview', { action: 'score', roundType, answers: finalAnswers });
    setReport(data.report);
    syncUser(data.user, data.levelInfo);
    setStarted(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Mock Interview</h1>
        <p className="text-sm text-gray-500">Text or voice interview, 5 questions, scored on correctness, communication and confidence.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-gray-100 p-1 rounded-xl inline-flex">
          {['Technical', 'HR'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRoundType(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${roundType === tab ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => speakText(questions[currentIdx] || 'Ready for your interview')} className="p-2.5 bg-white rounded-xl border border-orange-100 text-[#FF6B00]">
          <Volume2 size={18} />
        </button>
      </div>

      {!started && !report && (
        <div className="bg-white p-12 rounded-3xl border border-orange-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto">
            <Mic size={26} />
          </div>
          <h3 className="font-bold text-lg">Ready for your {roundType} round?</h3>
          <p className="text-sm text-gray-500">Answer by typing or speaking. You'll get feedback after each answer.</p>
          <button onClick={startInterview} className="bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600">
            Start interview
          </button>
        </div>
      )}

      {started && (
        <div className="space-y-4">
          <div className="bg-[#121622] rounded-3xl p-8 text-center text-white relative overflow-hidden">
            <div className={`w-24 h-24 rounded-full mx-auto border-4 ${speaking ? 'border-[#FF6B00] animate-pulse' : 'border-orange-500/40'} bg-gradient-to-b from-teal-700 to-slate-800 flex items-center justify-center text-3xl font-bold`}>
              👩‍💼
            </div>
            <h4 className="font-bold mt-4">Aria · AI Interviewer</h4>
            <p className="text-xs text-[#FF6B00] mt-1">{speaking ? 'ıllıl Speaking...' : listening ? '🎙️ Listening...' : 'Waiting for your answer'}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Hands-free mode</p>
              <p className="text-xs text-gray-400">Auto-listen after Aria finishes speaking</p>
            </div>
            <input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} className="w-5 h-5 accent-[#FF6B00]" />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-orange-100 space-y-6">
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>Question {currentIdx + 1} of 5</span>
              <button onClick={() => finishInterview()} className="flex items-center gap-1 hover:text-[#FF6B00]"><Flag size={14} /> End & score</button>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl text-sm text-gray-800">
              {questions[currentIdx]}
            </div>

            <div className="flex gap-2">
              <button onClick={startListening} className={`p-3 rounded-xl border ${listening ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-200'}`}>
                <Mic size={18} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm"
              />
              <button onClick={submitAnswer} className="bg-[#FF6B00] text-white px-4 rounded-xl"><Send size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
          <h3 className="font-bold text-lg">Interview Scorecard — Overall: {report.overall}/100</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-orange-50 rounded-2xl"><p className="text-xs text-gray-500">Correctness</p><p className="text-xl font-bold text-[#FF6B00]">{report.correctness}</p></div>
            <div className="p-4 bg-emerald-50 rounded-2xl"><p className="text-xs text-gray-500">Communication</p><p className="text-xl font-bold text-emerald-700">{report.communication}</p></div>
            <div className="p-4 bg-blue-50 rounded-2xl"><p className="text-xs text-gray-500">Confidence</p><p className="text-xl font-bold text-blue-700">{report.confidence}</p></div>
          </div>
          <p className="text-sm text-gray-600">{report.summary}</p>
        </div>
      )}
    </div>
  );
}