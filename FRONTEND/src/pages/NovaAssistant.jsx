import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { Mic, Send, Upload, Sparkles, AlertTriangle, Play, Volume2, Package } from 'lucide-react';

export default function NovaAssistant() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [messages, setMessages] = useState([{
    id: 1, sender: 'nova',
    en: "Hello! I'm Nova, your AI construction assistant at Vasavi Traders. I can help with cement mix ratios, plastering, waterproofing, electrical wiring, paint selection, crack repair, and much more. Ask me anything!",
    te: "నమస్కారం! నేను నోవా, వసవి ట్రేడర్స్ AI నిర్మాణ సహాయకురాలిని. సిమెంట్ మిక్స్ రేషియోలు, ప్లాస్టరింగ్, వాటర్‌ప్రూఫింగ్, ఎలక్ట్రికల్ వైరింగ్, పెయింట్ ఎంపిక, పగుళ్ల మరమ్మత్తు మరియు మరిన్ని విషయాలలో సహాయపడగలను!",
    text: "Hello! I'm Nova, your AI construction assistant. (నమస్కారం! నేను నోవా, మీ AI నిర్మాణ సహాయకురాలిని.)",
    products: [],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Speech Recognition (Telugu + English) ───────────────────────
  const handleMicrophoneClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser Speech Recognition not available.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'te-IN';
    r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = e => {
      const t = e.results[0][0].transcript;
      setInputValue(t);
      setTimeout(() => submitQuery(t), 500);
    };
    r.start();
  };

  // ── Telugu TTS ──────────────────────────────────────────────────
  const speakTelugu = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'te-IN';
    u.rate = 0.9;
    u.pitch = 1;

    // Try to find a Telugu voice
    const voices = window.speechSynthesis.getVoices();
    const teluguVoice = voices.find(v => v.lang.startsWith('te')) || voices.find(v => v.lang.includes('IN'));
    if (teluguVoice) u.voice = teluguVoice;

    u.onstart = () => setIsSynthesizing(true);
    u.onend = () => setIsSynthesizing(false);
    u.onerror = () => setIsSynthesizing(false);
    window.speechSynthesis.speak(u);
  };

  // ── Submit Query ────────────────────────────────────────────────
  const submitQuery = async (queryText = inputValue) => {
    if (!queryText.trim()) return;
    const userMsg = {
      id: Date.now(), sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!API_URL) throw new Error('API not configured');
      const { data } = await axios.post(`${API_URL}/api/nova`, { query: queryText });
      const novaMsg = {
        id: Date.now() + 1,
        sender: 'nova',
        en: data.en || data.response,
        te: data.te || '',
        text: data.response,
        products: data.products || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, novaMsg]);
      // Auto-speak Telugu response
      if (data.te) speakTelugu(data.te);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'nova',
        en: "I'm having trouble connecting right now. Please try again later.",
        te: "ప్రస్తుతం కనెక్ట్ అవ్వడంలో సమస్య. దయచేసి తర్వాత ప్రయత్నించండి.",
        text: "Connection error.",
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── File Upload ─────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: Date.now(), sender: 'user', image: imageUrl,
      text: 'Uploaded image for crack analysis',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsLoading(true);
    setTimeout(() => {
      const isPlaster = Math.random() > 0.5;
      const en = isPlaster
        ? "This appears to be a surface plaster crack — non-structural. Fill with crack filler putty, then apply primer and paint. We recommend Birla White putty and ACC Primer from our catalogue."
        : "⚠️ Warning: This may indicate a structural crack from foundation settlement. Do NOT patch — consult a structural engineer immediately. If it's confirmed non-structural, use UltraTech PPC cement mortar for repair.";
      const te = isPlaster
        ? "ఇది ప్లాస్టర్ ఉపరితల పగుళ్లుగా కనిపిస్తోంది — నిర్మాణపరమైనది కాదు. క్రాక్ ఫిల్లర్ పుట్టీతో పూడ్చి, ప్రైమర్ మరియు పెయింట్ వేయండి."
        : "⚠️ హెచ్చరిక: ఇది పునాది సెటిల్‌మెంట్ వల్ల నిర్మాణపరమైన పగుళ్లు కావచ్చు. ప్యాచ్ చేయకండి — వెంటనే స్ట్రక్చరల్ ఇంజనీర్‌ను సంప్రదించండి.";

      const msg = {
        id: Date.now() + 1, sender: 'nova',
        en, te, text: en,
        isAlert: !isPlaster,
        products: isPlaster
          ? [{ name: 'Birla White', brand: 'Birla White', price: '₹900-1200' }, { name: 'ACC Primer', brand: 'ACC', price: '₹150-250' }]
          : [{ name: 'UltraTech PPC', brand: 'UltraTech', price: '₹350-420' }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, msg]);
      speakTelugu(te);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-grow flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-8" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="relative p-2 rounded-lg" style={{ background: 'rgba(75,124,243,0.1)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: 'var(--color-accent)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-accent)' }}></span>
            </span>
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Nova AI Assistant</h1>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Construction Expert · Telugu Voice · Product Recommendations</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-grow rounded-xl overflow-hidden flex flex-col mb-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

          <div className="flex-grow overflow-y-auto p-5 space-y-5">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>

                {msg.sender === 'nova' && (
                  <div className="w-7 h-7 rounded-full mt-1 mr-3 flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(75,124,243,0.12)', border: '1px solid rgba(75,124,243,0.2)' }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                )}

                <div className="max-w-[85%] rounded-xl p-4"
                  style={msg.sender === 'user'
                    ? { background: 'rgba(75,124,243,0.15)', border: '1px solid rgba(75,124,243,0.25)', color: 'var(--color-text)', borderTopRightRadius: '4px' }
                    : msg.isAlert
                      ? { background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: 'var(--color-text)', borderTopLeftRadius: '4px' }
                      : { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderTopLeftRadius: '4px' }}>

                  {msg.isAlert && (
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: '#f87171' }}>
                      <AlertTriangle className="w-4 h-4" /> Structural Warning
                    </div>
                  )}

                  {msg.image && <img src={msg.image} alt="Upload" className="w-full max-w-xs rounded-lg mb-3" style={{ border: '1px solid var(--color-border)' }} />}

                  {/* Bilingual subtitles for Nova */}
                  {msg.sender === 'nova' && msg.en ? (
                    <div className="space-y-3">
                      <div className="text-sm leading-relaxed whitespace-pre-line">{msg.en}</div>
                      {msg.te && (
                        <div className="text-xs leading-relaxed whitespace-pre-line pt-2" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                          🇮🇳 {msg.te}
                        </div>
                      )}
                      {/* Product Recommendations */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                            <Package className="w-3.5 h-3.5" /> Recommended Products
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.products.map((p, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: 'var(--color-accent)' }}>
                                {p.name} {p.price && `· ${p.price}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-2">
                    {msg.sender === 'nova' && msg.te && (
                      <button onClick={() => speakTelugu(msg.te)} title="Play in Telugu"
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                        <Volume2 className="w-3.5 h-3.5" /> Telugu
                      </button>
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full mt-1 mr-3 flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(75,124,243,0.12)', border: '1px solid rgba(75,124,243,0.2)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            {isSynthesizing && <p className="text-xs ml-10 animate-pulse" style={{ color: 'var(--color-muted)' }}>🔊 Nova is speaking in Telugu…</p>}
          </div>

          {/* Input */}
          <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-end gap-2">
              <button onClick={() => fileInputRef.current.click()} title="Upload crack image"
                className="p-2.5 rounded-lg transition-colors"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'rgba(75,124,243,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                <Upload className="w-5 h-5" />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </button>

              <textarea value={inputValue} onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuery(); } }}
                placeholder="Ask about construction in English or Telugu…"
                className="flex-grow rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', height: '44px' }}
                rows={1} />

              <button onClick={handleMicrophoneClick}
                className="p-2.5 rounded-lg transition-all"
                style={isListening
                  ? { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }
                  : { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                <Mic className="w-5 h-5" />
              </button>

              <button onClick={() => submitQuery()} disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-lg btn-primary disabled:opacity-40">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-muted)' }}>
              Try: "Cement mix ratio for slab" · "How to waterproof terrace" · Voice supports Telugu
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
