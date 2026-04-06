import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Mic, Package, Send, Sparkles, Upload, Volume2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const nowLabel = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const initialMessage = {
  id: 1,
  sender: 'nova',
  en: "Hello! I'm Nova, your AI construction assistant at Vasavi Traders. I can help with cement mix ratios, plastering, waterproofing, electrical wiring, paint selection, crack repair, and much more. Ask me anything!",
  te: 'Namaskaram! Nenu Nova, Vasavi Traders AI nirmanam sahayakuralini. Construction ki sambandhinchina questions nannu adagandi.',
  text: "Hello! I'm Nova, your AI construction assistant.",
  products: [],
  timestamp: nowLabel(),
};

export default function NovaAssistant() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [messages, setMessages] = useState([initialMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakTelugu = (text) => {
    if (!('speechSynthesis' in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'te-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const teluguVoice = voices.find((voice) => voice.lang.startsWith('te')) || voices.find((voice) => voice.lang.includes('IN'));
    if (teluguVoice) {
      utterance.voice = teluguVoice;
    }

    utterance.onstart = () => setIsSynthesizing(true);
    utterance.onend = () => setIsSynthesizing(false);
    utterance.onerror = () => setIsSynthesizing(false);
    window.speechSynthesis.speak(utterance);
  };

  const submitQuery = async (queryText = inputValue) => {
    const trimmedQuery = queryText.trim();
    if (!trimmedQuery) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: 'user',
        text: trimmedQuery,
        timestamp: nowLabel(),
      },
    ]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!API_URL) {
        throw new Error('API not configured');
      }

      const { data } = await axios.post(`${API_URL}/api/nova`, { query: trimmedQuery });
      const responseMessage = {
        id: Date.now() + 1,
        sender: 'nova',
        en: data.en || data.response,
        te: data.te || '',
        text: data.response,
        products: Array.isArray(data.products) ? data.products : [],
        timestamp: nowLabel(),
      };

      setMessages((current) => [...current, responseMessage]);
      if (responseMessage.te) {
        speakTelugu(responseMessage.te);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          sender: 'nova',
          en: "I'm having trouble connecting right now. Please try again later.",
          te: 'Prastutam connect avvadam ledu. Dayachesi konchem tarvata try cheyandi.',
          text: 'Connection error.',
          products: [],
          timestamp: nowLabel(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrophoneClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser speech recognition is not available.');
      return;
    }

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'te-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setTimeout(() => submitQuery(transcript), 400);
    };
    recognition.start();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: 'user',
        image: previewUrl,
        text: 'Uploaded image for crack analysis',
        timestamp: nowLabel(),
      },
      {
        id: Date.now() + 1,
        sender: 'nova',
        en: 'Image-based crack analysis is not available in this build yet. Please describe the crack in text or contact Vasavi Traders for an on-site assessment.',
        te: 'Ii build lo image crack analysis inka andubatulo ledu. Dayachesi crack vivaralu text lo pampandi leka on-site assessment kosam Vasavi Traders ni sampradinchandi.',
        text: 'Image analysis is not available yet.',
        products: [],
        timestamp: nowLabel(),
      },
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6"
        style={{ height: 'calc(100vh - 64px)' }}
      >
        <div
          className="mb-5 flex items-center gap-3 rounded-xl p-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="relative rounded-lg p-2" style={{ background: 'rgba(75,124,243,0.1)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            </span>
          </div>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              Nova AI Assistant
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Construction expert, Telugu voice, product recommendations
            </p>
          </div>
        </div>

        <div
          className="mb-4 flex flex-1 flex-col overflow-hidden rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'nova' ? (
                  <div
                    className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'rgba(75,124,243,0.12)', border: '1px solid rgba(75,124,243,0.2)' }}
                  >
                    <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                ) : null}

                <div
                  className="max-w-[85%] rounded-xl p-4"
                  style={
                    message.sender === 'user'
                      ? {
                          background: 'rgba(75,124,243,0.15)',
                          border: '1px solid rgba(75,124,243,0.25)',
                          color: 'var(--color-text)',
                          borderTopRightRadius: '4px',
                        }
                      : message.isAlert
                        ? {
                            background: 'rgba(220,38,38,0.08)',
                            border: '1px solid rgba(220,38,38,0.25)',
                            color: 'var(--color-text)',
                            borderTopLeftRadius: '4px',
                          }
                        : {
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            borderTopLeftRadius: '4px',
                          }
                  }
                >
                  {message.isAlert ? (
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: '#f87171' }}>
                      <AlertTriangle className="h-4 w-4" />
                      Structural Warning
                    </div>
                  ) : null}

                  {message.image ? (
                    <img
                      src={message.image}
                      alt="Upload preview"
                      className="mb-3 w-full max-w-xs rounded-lg"
                      style={{ border: '1px solid var(--color-border)' }}
                    />
                  ) : null}

                  {message.sender === 'nova' && message.en ? (
                    <div className="space-y-3">
                      <div className="whitespace-pre-line text-sm leading-relaxed">{message.en}</div>
                      {message.te ? (
                        <div
                          className="whitespace-pre-line pt-2 text-xs leading-relaxed"
                          style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                        >
                          {message.te}
                        </div>
                      ) : null}

                      {message.products?.length ? (
                        <div className="pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                            <Package className="h-3.5 w-3.5" />
                            Recommended Products
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.products.map((product, index) => (
                              <span
                                key={`${product.name}-${index}`}
                                className="rounded-full px-2.5 py-1 text-xs"
                                style={{
                                  background: 'rgba(255,215,0,0.08)',
                                  border: '1px solid rgba(255,215,0,0.2)',
                                  color: 'var(--color-accent)',
                                }}
                              >
                                {product.name}
                                {product.price ? ` - ${product.price}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  )}

                  <div className="mt-2 flex items-center justify-end gap-2">
                    {message.sender === 'nova' && message.te ? (
                      <button
                        type="button"
                        onClick={() => speakTelugu(message.te)}
                        title="Play in Telugu"
                        className="flex items-center gap-1 text-xs transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Telugu
                      </button>
                    ) : null}
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div
                  className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(75,124,243,0.12)', border: '1px solid rgba(75,124,243,0.2)' }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--color-accent)', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
            {isSynthesizing ? (
              <p className="ml-10 animate-pulse text-xs" style={{ color: 'var(--color-muted)' }}>
                Nova is speaking in Telugu...
              </p>
            ) : null}
          </div>

          <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload crack image"
                className="rounded-lg p-2.5 transition-colors"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >
                <Upload className="h-5 w-5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </button>

              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submitQuery();
                  }
                }}
                placeholder="Ask about construction in English or Telugu..."
                className="h-[44px] flex-grow resize-none rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                rows={1}
              />

              <button
                type="button"
                onClick={handleMicrophoneClick}
                className="rounded-lg p-2.5 transition-all"
                style={
                  isListening
                    ? { background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }
                    : { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }
                }
              >
                <Mic className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => submitQuery()}
                disabled={!inputValue.trim() || isLoading}
                className="btn-primary rounded-lg p-2.5 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
              Try: slab cement mix ratio, terrace waterproofing, or electrical wiring guide. Voice supports Telugu.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
