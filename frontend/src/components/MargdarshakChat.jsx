import { useState } from 'react';
import { Compass, X, Send, Sparkles } from 'lucide-react';
import { API, useAuth } from '../context/AuthContext';

export default function MargdarshakChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Namaste! 🙏 I'm Margdarshak AI, your placement guide. Ask me anything — resume tips, DSA doubts, interview prep, or where to go next in SafalPath."
    }
  ]);

  if (!user) return null;

  const sendMessage = async (preset) => {
    const text = preset || input;
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await API.post('/ai/chat', { message: text });
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Unable to reach Margdarshak right now. Make sure the backend server is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-[#FF6B00] to-amber-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><span className="aria-avatar" style={{ width: 32, height: 32 }}><span className="aria-hair"/><span className="aria-eyes"><i/><i/></span><span className="aria-smile"/><span className="aria-glow"/></span></div>
              <div>
                <h4 className="font-bold text-sm">Margdarshak AI</h4>
                <p className="text-xs text-orange-100">● Your placement guide · {user?.demoMode ? 'interactive preview' : 'online'}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]">
            {messages.map((m, idx) => (
              <div key={idx} className={`p-3 rounded-2xl text-sm whitespace-pre-line ${m.sender === 'bot' ? 'bg-white text-gray-700 shadow-sm border border-gray-100' : 'bg-[#FF6B00] text-white ml-8'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 italic">Margdarshak is thinking...</div>}
          </div>

          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto">
            {['What should I do first?', 'Make me a plan for today'].map((chip) => (
              <button key={chip} onClick={() => sendMessage(chip)} className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#FF6B00] hover:text-[#FF6B00] flex items-center gap-1">
                <Sparkles size={12} className="text-[#FF6B00]" /> {chip}
              </button>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Margdarshak..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B00]"
            />
            <button onClick={() => sendMessage()} className="bg-[#FF6B00] text-white p-2.5 rounded-xl hover:bg-orange-600"><Send size={16} /></button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full bg-[#FF6B00] text-white shadow-lg shadow-orange-300 flex items-center justify-center hover:scale-105 transition ml-auto">
        {open ? <X size={24} /> : <Compass size={26} />}
      </button>
    </div>
  );
}
