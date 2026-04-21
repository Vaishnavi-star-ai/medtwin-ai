import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';

const API = 'http://localhost:5000/api/medai';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m MedTwin AI, your medical assistant 🩺\n\nI can help you with:\n• Health & wellness questions\n• Understanding symptoms\n• Medication info\n• Diet & nutrition tips\n\nTry asking: "What helps with headaches?" or "Tell me about diabetes"\n\n💡 Upload a report on the Dashboard for personalized analysis!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [interimText, setInterimText] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const sid = localStorage.getItem('patientUID') || 'demo';

  const speakResponse = (text) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1; u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  // ═══════════════════════════════════
  // VOICE INPUT — Speech to Text
  // ═══════════════════════════════════
  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText('');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Your browser doesn't support Speech Recognition. Try Chrome.");

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = input;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          setInput(finalTranscript);
          setInterimText('');
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };
    recognition.onerror = (e) => {
      console.log('Speech error:', e.error);
      setIsListening(false);
      setInterimText('');
    };

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  // Auto-send after voice stops (optional — auto-submit after silence)
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    // Stop listening if active
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); setInterimText(''); }

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]); setInput(''); setIsLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId: sid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      speakResponse(data.reply.replace(/[*#•]/g, ''));
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error: ' + err.message }]);
    } finally { setIsLoading(false); }
  };

  const suggestions = [
    "What helps with headaches?",
    "Tell me about diabetes management",
    "How to lower blood pressure?",
    "Tips for better sleep",
    "What vitamins should I take?"
  ];

  return (
    <div className="page-enter max-w-4xl mx-auto py-6 px-4 flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <div className="flex-1 flex flex-col bg-white border border-[#e8dccf] rounded-2xl shadow-lg overflow-hidden">

        {/* ═══ HEADER ═══ */}
        <div className="bg-gradient-to-r from-[#77DD77]/15 to-[#e8fbe8] px-6 py-4 border-b border-[#77DD77]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#77DD77] text-white rounded-xl shadow-md"><Bot size={22} /></div>
            <div>
              <h2 className="font-bold text-[#2f2a26] text-lg">MedTwin AI</h2>
              <p className="text-xs text-[#a89b8d] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#77DD77] animate-pulse" />
                Medical Assistant • Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice output toggle */}
            <button onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); if(isVoiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel(); }}
              className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${isVoiceEnabled ? 'bg-[#77DD77] text-white shadow-md' : 'bg-white text-[#a89b8d] border border-[#d0bfae] hover:border-[#77DD77]'}`}>
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
            </button>
          </div>
        </div>

        {/* ═══ MESSAGES ═══ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#faf8f5]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#77DD77] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div className={`px-4 py-3 max-w-[80%] rounded-2xl text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#77DD77] text-white rounded-tr-sm shadow-md'
                  : 'bg-white border border-[#e8dccf] text-[#403933] rounded-tl-sm shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#e8dccf] flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-[#a89b8d]" />
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#77DD77] flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white border border-[#e8dccf] rounded-2xl px-5 py-3 rounded-tl-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#77DD77] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#77DD77] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#77DD77] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[#a89b8d] text-sm ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions (show only if no user messages yet) */}
          {messages.length === 1 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-[#a89b8d] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> Suggested Questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); }}
                    className="px-3.5 py-2 bg-white border border-[#e8dccf] text-[#403933] text-sm rounded-xl font-medium hover:bg-[#e8fbe8] hover:border-[#77DD77]/40 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ═══ VOICE LISTENING INDICATOR ═══ */}
        {isListening && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center gap-3">
            <div className="relative">
              <Mic size={18} className="text-red-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-red-600 font-bold text-sm">🎙️ Listening... speak now</p>
              {interimText && <p className="text-red-400 text-xs italic mt-0.5">"{interimText}"</p>}
            </div>
            <button onClick={toggleListen} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
              Stop
            </button>
          </div>
        )}

        {/* ═══ INPUT BAR ═══ */}
        <div className="p-4 bg-white border-t border-[#e8dccf]">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            {/* Mic Button — BIG & VISIBLE */}
            <button type="button" onClick={toggleListen}
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg'
                  : 'bg-[#faf0e6] text-[#77DD77] border border-[#d0bfae] hover:bg-[#e8fbe8] hover:border-[#77DD77]'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your question'}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder={isListening ? "Listening... or type here" : "Type or tap 🎤 to speak..."}
                rows={1}
                className="w-full bg-[#faf0e6] border border-[#d0bfae] text-[#2f2a26] text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:border-transparent resize-none"
                style={{ minHeight: '48px', maxHeight: '120px' }} />
            </div>

            {/* Send Button */}
            <button type="submit" disabled={isLoading || !input.trim()}
              className="shrink-0 w-12 h-12 bg-[#77DD77] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#5ec45e] transition-colors shadow-md disabled:shadow-none">
              <Send size={18} />
            </button>
          </form>
          <p className="text-center mt-2.5 text-[10px] text-[#a89b8d]">MedTwin AI can make mistakes. Always verify clinical information with a doctor.</p>
        </div>
      </div>
    </div>
  );
}
