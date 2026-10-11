import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveAudioPlayer, LiveMicRecorder, arrayBufferToBase64 } from './utils/audio';

// ─── Types ───────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'interrupted' | 'reconnecting' | 'disconnected' | 'error';
type Screen = 'welcome' | 'chat';
type Theme = 'light' | 'dark';
type Language = 'english' | 'tamil';
type FieldStatus = 'unknown' | 'extracted' | 'confirmed';
type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

// Simple UUID v4 generator for guest session
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem('lyka_session_id');
  if (!id || id.length < 10) {
    id = generateSessionId();
    sessionStorage.setItem('lyka_session_id', id);
  }
  return id;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LeadField {
  value: string | null;
  status: FieldStatus;
}

interface LeadInfo {
  name: LeadField;
  phone: LeadField;
  email: LeadField;
  lead_source: LeadField;
  intent: LeadField;
  interest: LeadField;
  buyer_type: LeadField;
  property_type: LeadField;
  location: LeadField;
  country: LeadField;
  state_province: LeadField;
  city: LeadField;
  budget: LeadField;
  currency: LeadField;
  rental_period: LeadField;
  property_size: LeadField;
  area_unit: LeadField;
  bedrooms: LeadField;
  bathrooms: LeadField;
  amenities: LeadField;
  timeline: LeadField;
  notes: LeadField;
  qualification_status: LeadField;
}

const emptyField = (): LeadField => ({ value: null, status: 'unknown' });

const initialLead = (): LeadInfo => ({
  name: emptyField(),
  phone: emptyField(),
  email: emptyField(),
  lead_source: emptyField(),
  intent: emptyField(),
  interest: emptyField(),
  buyer_type: emptyField(),
  property_type: emptyField(),
  location: emptyField(),
  country: emptyField(),
  state_province: emptyField(),
  city: emptyField(),
  budget: emptyField(),
  currency: emptyField(),
  rental_period: emptyField(),
  property_size: emptyField(),
  area_unit: emptyField(),
  bedrooms: emptyField(),
  bathrooms: emptyField(),
  amenities: emptyField(),
  timeline: emptyField(),
  notes: emptyField(),
  qualification_status: emptyField(),
});

const LYKA_LOGO = 'https://lh3.googleusercontent.com/aida/AEtjO1UeuDRD3epOwvTy3fM4e-U7QxYKV2MtUqjGOtvxWy9IEfVuiWNZup1Wr0lBlijxhrFSyo4ZByh73Wt8pGVfXh2V3aoXzpivhnA7cikvYUGyc6csNPIEmaPdiPQkoiPGtcczZ2xOg6CPVFh3grgCc02eOmkPaDGT5BrrQChkvDW9BtgPBS9I7M8ZvSmJ6WVXLVOAz8OWqbyTXILRSkHMSnx7V7224qx1yDiprfDp4tkISwGOXx7yo5R0_w';

const DUBAI_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLChmNfOw4kI8CB-YNCcOGaQbf6str1OZ__wWKIQbg3pTngyVIwoVy-lXIar4xFB1lHMUIs_qzdAa7BcoLx2CBBoHy_BR9c71YeVrO-ZDSxhJQBIVDr4Vc-EO_XSHKGvvNTrB8PivbDl0byOi49V2EJlNbpQwbA2dNxSOImtctvgllJVe4GTLUkpFsTXK38kHJsHak-5Y5q8bxhQnArd0jQOJX0Q5tY2RC3O5syZZz-EUfcaw1LS5e';

// ─── App ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('english');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [lead, setLead] = useState<LeadInfo>(initialLead());
  const [showSummary, setShowSummary] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [micEnergy, setMicEnergy] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [conversationId, setConversationId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const recorderRef = useRef<LiveMicRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Health check ──
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        setServerStatus(data.hasApiKey ? 'ok' : 'error');
        if (!data.hasApiKey) setErrorMsg('Gemini API key not configured on server.');
      })
      .catch(() => {
        setServerStatus('error');
        setErrorMsg('Cannot connect to server.');
      });
  }, []);

  // ── Scroll to bottom ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Theme ──
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      playerRef.current?.close();
      recorderRef.current?.stop();
    };
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateLeadFromServer = useCallback((data: any) => {
    setLead(prev => {
      const updated = { ...prev };
      const map: Record<string, keyof LeadInfo> = {
        name: 'name',
        phone: 'phone',
        email: 'email',
        lead_source: 'lead_source',
        intent: 'intent',
        interest: 'interest',
        buyer_type: 'buyer_type',
        property_type: 'property_type',
        location: 'location',
        country: 'country',
        state_province: 'state_province',
        city: 'city',
        budget: 'budget',
        currency: 'currency',
        rental_period: 'rental_period',
        property_size: 'property_size',
        area_unit: 'area_unit',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        amenities: 'amenities',
        timeline: 'timeline',
        qualification_status: 'qualification_status',
        notes: 'notes',
      };
      for (const [key, field] of Object.entries(map)) {
        if (data[key] && data[key] !== '') {
          updated[field] = { value: data[key], status: 'extracted' };
        }
      }
      return updated;
    });
    setSaveStatus('unsaved');
  }, []);

  // ─── Text Chat ─────────────────────────────────────────────────────
  const sendTextMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInputText('');
    setIsLoading(true);

    // If voice session is active, send through WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && voiceState !== 'idle' && voiceState !== 'disconnected') {
      wsRef.current.send(JSON.stringify({ type: 'text', text }));
      setIsLoading(false);
      return;
    }

    // Otherwise use REST API
    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, language, sessionId, conversationId }),
      });

      const data = await res.json();

      if (data.error) {
        addMessage({
          id: `e-${Date.now()}`,
          role: 'system',
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        });
      } else {
        if (data.message) {
          addMessage({
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          });
        }
        if (data.leadUpdate) {
          updateLeadFromServer(data.leadUpdate);
        }
        if (data.saveResult) {
          setSaveStatus(data.saveResult.success ? 'saved' : 'error');
        }
      }
    } catch (err: any) {
      addMessage({
        id: `e-${Date.now()}`,
        role: 'system',
        content: `Connection error: ${err.message || 'Failed to reach server'}`,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Voice Session ─────────────────────────────────────────────────
  const startVoiceSession = async () => {
    if (voiceState === 'connecting' || voiceState === 'listening' || voiceState === 'speaking') return;

    setVoiceState('connecting');
    setErrorMsg('');

    try {
      // Init audio player
      playerRef.current = new LiveAudioPlayer(
        (playing) => {
          if (playing) {
            setVoiceState('speaking');
            recorderRef.current?.setAgentSpeaking(true);
          } else {
            setVoiceState(prev => prev === 'speaking' ? 'listening' : prev);
            recorderRef.current?.setAgentSpeaking(false);
          }
          setAudioEnergy(playing ? 0.5 : 0);
        },
        (energy) => setAudioEnergy(energy)
      );

      // Init mic recorder
      recorderRef.current = new LiveMicRecorder(
        (base64Chunk) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Chunk }));
          }
        },
        (energy) => setMicEnergy(energy),
        undefined,
        language === 'tamil' ? 'tamil' : 'english',
        'default'
      );

      const micStarted = await recorderRef.current.start();
      if (!micStarted) {
        setVoiceState('error');
        setErrorMsg('Microphone access denied. Please allow microphone permission.');
        return;
      }

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live-ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'start',
          voice: 'Kore',
          language: language === 'tamil' ? 'tamil' : 'english',
          gender: 'female',
          mode: 'chatbot',
          sessionId,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setVoiceState('listening');
          } else if (msg.type === 'audio') {
            playerRef.current?.playChunk(msg.data);
          } else if (msg.type === 'transcript') {
            const role = msg.role === 'agent' ? 'assistant' : 'user';
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === role && lastMsg.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMsg, content: lastMsg.content + msg.text },
                ];
              }
              return [
                ...prev,
                {
                  id: `t-${Date.now()}-${Math.random()}`,
                  role,
                  content: msg.text,
                  timestamp: new Date(),
                  isStreaming: true,
                },
              ];
            });
          } else if (msg.type === 'turn_complete') {
            setMessages(prev =>
              prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
            );
            setVoiceState('listening');
          } else if (msg.type === 'lead_update') {
            updateLeadFromServer(msg.lead);
          } else if (msg.type === 'lead_save_result') {
            setSaveStatus(msg.success ? 'saved' : 'error');
          } else if (msg.type === 'interrupted') {
            playerRef.current?.stopAndClear();
            setVoiceState('interrupted');
            setTimeout(() => setVoiceState('listening'), 300);
          } else if (msg.type === 'error') {
            setErrorMsg(msg.message || 'Voice connection error');
            setVoiceState('error');
          } else if (msg.type === 'status') {
            if (msg.status === 'connecting') setVoiceState('connecting');
            else if (msg.status === 'closed' || msg.status === 'idle') {
              setVoiceState('disconnected');
            }
          }
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onerror = () => {
        setVoiceState('error');
        setErrorMsg('WebSocket connection failed');
      };

      ws.onclose = () => {
        setVoiceState('disconnected');
        recorderRef.current?.stop();
      };
    } catch (err: any) {
      setVoiceState('error');
      setErrorMsg(err.message || 'Failed to start voice session');
    }
  };

  const stopVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    playerRef.current?.close();
    playerRef.current = null;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setVoiceState('idle');
    setAudioEnergy(0);
    setMicEnergy(0);
  };

  const interruptVoice = () => {
    playerRef.current?.stopAndClear();
    wsRef.current?.send(JSON.stringify({ type: 'barge_in' }));
    setVoiceState('listening');
  };

  // ─── Lead edit helpers ──────────────────────────────────────────────
  const startEdit = (field: string) => {
    setEditField(field);
    setEditValue((lead as any)[field]?.value || '');
  };

  const saveEdit = () => {
    if (editField) {
      setLead(prev => ({
        ...prev,
        [editField]: { value: editValue || null, status: editValue ? 'confirmed' : 'unknown' },
      }));
      setEditField(null);
      setEditValue('');
    }
  };

  const confirmField = (field: string) => {
    setLead(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof LeadInfo], status: 'confirmed' },
    }));
  };

  // ─── Start Chat ────────────────────────────────────────────────────
  const startChat = (withVoice: boolean = false) => {
    setScreen('chat');
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: language === 'tamil'
        ? 'வணக்கம்! லைகா ரியல்டிக்கு வரவேற்கிறோம். நான் உங்கள் AI property assistant. உங்களுக்கு எப்படி உதவ வேண்டும்? வீடு வாங்க, வாடகைக்கு எடுக்க, விற்க, அல்லது முதலீடு செய்ய ஆர்வமா?'
        : "Hi, welcome to Lyka Realty! I'm your AI property assistant. How can I help you today? Are you looking to buy, sell, rent, or explore investment opportunities?",
      timestamp: new Date(),
    }]);

    // Create a server-side conversation
    fetch('/api/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, channel: withVoice ? 'voice' : 'text', language }),
    })
      .then(r => r.json())
      .then(data => { if (data.conversationId) setConversationId(data.conversationId); })
      .catch(() => {});
    if (withVoice) {
      setTimeout(() => startVoiceSession(), 500);
    }
  };

  // ─── Voice State Helpers ───────────────────────────────────────────
  const voiceStateLabel: Record<VoiceState, string> = {
    idle: 'Start Voice',
    connecting: 'Connecting…',
    listening: 'Listening',
    processing: 'Processing…',
    speaking: 'Speaking',
    interrupted: 'Interrupted',
    reconnecting: 'Reconnecting…',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  const voiceActive = ['connecting', 'listening', 'processing', 'speaking', 'interrupted'].includes(voiceState);

  // ─── Render: Welcome ───────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div className={`lyka-app ${theme}`}>
        <div className="welcome-screen">
          {/* Background */}
          <div className="welcome-bg">
            <img src={DUBAI_IMG} alt="" className="welcome-bg-img" />
            <div className="welcome-bg-overlay" />
          </div>

          {/* Content */}
          <div className="welcome-content">
            <div className="welcome-logo-wrap">
              <img src={LYKA_LOGO} alt="Lyka Realty" className="welcome-logo" />
              <span className="welcome-brand">LYKA REALTY</span>
            </div>

            <div className="welcome-orb" aria-hidden="true">
              <div className="orb-glow" />
              <div className="orb-body">
                <div className="orb-gradient" />
                <div className="orb-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="welcome-title">Welcome to Lyka Realty</h1>
            <p className="welcome-subtitle">Let's find a property that feels right for you.</p>

            {/* Language Selector */}
            <div className="welcome-lang">
              <button
                className={`lang-btn ${language === 'english' ? 'active' : ''}`}
                onClick={() => setLanguage('english')}
              >
                English
              </button>
              <button
                className={`lang-btn ${language === 'tamil' ? 'active' : ''}`}
                onClick={() => setLanguage('tamil')}
              >
                தமிழ்
              </button>
            </div>

            {/* Actions */}
            <div className="welcome-actions">
              <button className="btn-primary-gold" onClick={() => startChat(true)}>
                <span className="btn-icon">🎙️</span>
                Talk with Voice
              </button>
              <button className="btn-secondary-glass" onClick={() => startChat(false)}>
                <span className="btn-icon">💬</span>
                Continue with Text
              </button>
              <button className="btn-ghost" onClick={() => setShowSignIn(true)}>
                Sign In
              </button>
            </div>

            {/* Theme toggle */}
            <button className="theme-toggle-welcome" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Server status */}
            <div className="welcome-status">
              <span className={`status-dot ${serverStatus}`} />
              <span className="status-text">
                {serverStatus === 'checking' ? 'Connecting...' :
                 serverStatus === 'ok' ? 'AI Ready' :
                 errorMsg || 'Offline'}
              </span>
            </div>
          </div>

          {/* Sign-in modal */}
          {showSignIn && (
            <div className="modal-overlay" onClick={() => setShowSignIn(false)}>
              <div className="signin-modal" onClick={e => e.stopPropagation()}>
                <h2>Sign In</h2>
                <p className="signin-note">Authentication will be connected in Phase 2. You can continue as a guest.</p>
                <input type="email" placeholder="Email address" className="signin-input" disabled />
                <input type="password" placeholder="Password" className="signin-input" disabled />
                <button className="btn-primary-gold signin-btn" disabled>Sign In (Coming Soon)</button>
                <button className="btn-ghost" onClick={() => { setShowSignIn(false); startChat(false); }}>
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Chat ──────────────────────────────────────────────────
  const filledFields = Object.entries(lead).filter(([, f]) => f.value);
  const missingFields = Object.entries(lead)
    .filter(([k, f]) => !f.value && !['notes', 'qualification_status', 'currency', 'bathrooms', 'amenities', 'area_unit', 'rental_period', 'property_size', 'lead_source', 'state_province', 'country'].includes(k))
    .map(([k]) => k.replace(/_/g, ' '));

  return (
    <div className={`lyka-app ${theme}`}>
      <div className="chat-layout">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <button className="header-back" onClick={() => { stopVoiceSession(); setScreen('welcome'); }}>
              ←
            </button>
            <img src={LYKA_LOGO} alt="Lyka" className="header-logo" />
            <div className="header-info">
              <span className="header-title">Lyka AI Assistant</span>
              <span className="header-status-text">
                {voiceActive ? voiceStateLabel[voiceState] : 'Online'}
              </span>
            </div>
          </div>
          <div className="header-right">
            <button className="header-btn" onClick={() => setLanguage(l => l === 'english' ? 'tamil' : 'english')}>
              {language === 'english' ? 'EN' : 'த'}
            </button>
            <button className="header-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className={`header-btn summary-toggle ${showSummary ? 'active' : ''}`}
              onClick={() => setShowSummary(s => !s)}
            >
              📋
            </button>
          </div>
        </header>

        <div className="chat-body">
          {/* Messages Area */}
          <div className="chat-messages-area">
            {/* Voice Orb */}
            {voiceActive && (
              <div className="voice-orb-area">
                <div className={`voice-orb ${voiceState}`} style={{ transform: `scale(${1 + audioEnergy * 0.3})` }}>
                  <div className="voice-orb-ring" style={{ opacity: 0.3 + audioEnergy * 0.7 }} />
                  <div className="voice-orb-core">
                    {voiceState === 'speaking' && (
                      <div className="voice-bars">
                        {[0, 1, 2, 3, 4].map(i => (
                          <span key={i} className="voice-bar" style={{
                            height: `${12 + audioEnergy * 20 + Math.random() * 8}px`,
                            animationDelay: `${i * 0.1}s`,
                          }} />
                        ))}
                      </div>
                    )}
                    {voiceState === 'listening' && (
                      <div className="voice-bars mic-bars">
                        {[0, 1, 2, 3, 4].map(i => (
                          <span key={i} className="voice-bar mic" style={{
                            height: `${8 + micEnergy * 24 + Math.random() * 6}px`,
                            animationDelay: `${i * 0.08}s`,
                          }} />
                        ))}
                      </div>
                    )}
                    {voiceState === 'connecting' && <div className="voice-spinner" />}
                  </div>
                </div>
                <span className="voice-state-label">{voiceStateLabel[voiceState]}</span>
                <div className="voice-controls">
                  {voiceState === 'speaking' && (
                    <button className="voice-ctrl-btn" onClick={interruptVoice} title="Interrupt">⏸</button>
                  )}
                  <button className="voice-ctrl-btn stop" onClick={stopVoiceSession} title="Stop Voice">⏹</button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`msg ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">
                      <span>✦</span>
                    </div>
                  )}
                  <div className="msg-bubble">
                    <p>{msg.content}</p>
                    {msg.isStreaming && <span className="streaming-dot">●</span>}
                  </div>
                  {msg.role === 'user' && (
                    <div className="msg-avatar user-avatar">
                      <span>👤</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="msg assistant">
                  <div className="msg-avatar"><span>✦</span></div>
                  <div className="msg-bubble typing">
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Summary Panel */}
          {showSummary && (
            <aside className="summary-panel">
              <div className="summary-header">
                <h3>Customer Requirements</h3>
                <button className="summary-close" onClick={() => setShowSummary(false)}>×</button>
              </div>
              <div className="summary-body">
                {filledFields.length === 0 ? (
                  <p className="summary-empty">Details will appear here as the conversation progresses.</p>
                ) : (
                  <div className="summary-fields">
                    {filledFields.map(([key, field]) => (
                      <div key={key} className={`summary-field ${field.status}`}>
                        <div className="field-header">
                          <span className="field-label">{key.replace(/_/g, ' ')}</span>
                          <span className={`field-badge ${field.status}`}>
                            {field.status === 'confirmed' ? '✓' : field.status === 'extracted' ? '?' : '—'}
                          </span>
                        </div>
                        {editField === key ? (
                          <div className="field-edit">
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="field-edit-input"
                              autoFocus
                            />
                            <button className="field-save-btn" onClick={saveEdit}>Save</button>
                          </div>
                        ) : (
                          <div className="field-value-row">
                            <span className="field-value">{field.value}</span>
                            <div className="field-actions">
                              {field.status === 'extracted' && (
                                <button className="field-action" onClick={() => confirmField(key)}>✓</button>
                              )}
                              <button className="field-action" onClick={() => startEdit(key)}>✏️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {missingFields.length > 0 && (
                  <div className="summary-missing">
                    <span className="missing-label">Not yet discussed:</span>
                    <div className="missing-tags">
                      {missingFields.map(f => (
                        <span key={f} className="missing-tag">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className={`summary-save-status ${saveStatus}`}>
                  <span className="save-status-dot" />
                  <span className="save-status-text">
                    {saveStatus === 'unsaved' && 'Unsaved'}
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && 'Saved to database'}
                    {saveStatus === 'error' && 'Save failed — will retry'}
                  </span>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Quick Reply Chips */}
        {messages.length <= 2 && !voiceActive && (
          <div className="quick-replies">
            {(language === 'tamil'
              ? [
                  { label: '🏠 வீடு வாங்க', text: 'நான் ஒரு வீடு வாங்க விரும்புகிறேன்' },
                  { label: '🏢 வாடகைக்கு', text: 'நான் ஒரு வீட்டை வாடகைக்கு எடுக்க விரும்புகிறேன்' },
                  { label: '💰 முதலீடு', text: 'நான் ரியல் எஸ்டேட்டில் முதலீடு செய்ய ஆர்வமாக உள்ளேன்' },
                  { label: '🏗️ விற்க', text: 'நான் எனது சொத்தை விற்க விரும்புகிறேன்' },
                  { label: '📊 நிலம்', text: 'நான் நிலம் வாங்க அல்லது விற்க விரும்புகிறேன்' },
                ]
              : [
                  { label: '🏠 Buy a Home', text: 'I want to buy a home' },
                  { label: '🏢 Rent a Property', text: 'I want to rent a property' },
                  { label: '💰 Invest', text: 'I want to invest in real estate' },
                  { label: '🏗️ Sell Property', text: 'I want to sell my property' },
                  { label: '📊 Land', text: 'I want to buy or sell land' },
                  { label: '❓ Just Asking', text: 'I have a general real estate question' },
                ]
            ).map(chip => (
              <button
                key={chip.label}
                className="quick-reply-chip"
                onClick={() => {
                  setInputText(chip.text);
                  setTimeout(() => {
                    const userMsg: ChatMessage = {
                      id: `u-${Date.now()}`,
                      role: 'user',
                      content: chip.text,
                      timestamp: new Date(),
                    };
                    addMessage(userMsg);
                    setInputText('');
                    setIsLoading(true);
                    fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                        language, sessionId, conversationId,
                      }),
                    })
                      .then(r => r.json())
                      .then(data => {
                        if (data.message) addMessage({ id: `a-${Date.now()}`, role: 'assistant', content: data.message, timestamp: new Date() });
                        if (data.leadUpdate) updateLeadFromServer(data.leadUpdate);
                        if (data.saveResult) setSaveStatus(data.saveResult.success ? 'saved' : 'error');
                      })
                      .catch(() => addMessage({ id: `e-${Date.now()}`, role: 'system', content: 'Connection error', timestamp: new Date() }))
                      .finally(() => setIsLoading(false));
                  }, 50);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="chat-composer">
          {/* Error bar */}
          {errorMsg && voiceState === 'error' && (
            <div className="error-bar">
              <span>{errorMsg}</span>
              <button onClick={() => { setErrorMsg(''); setVoiceState('idle'); }}>Dismiss</button>
            </div>
          )}
          <div className="composer-inner">
            <input
              ref={inputRef}
              className="composer-input"
              type="text"
              placeholder={language === 'tamil' ? 'உங்கள் செய்தியை தட்டச்சு செய்யுங்கள்...' : 'Type your message...'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendTextMessage()}
              disabled={isLoading}
            />
            {inputText.trim() ? (
              <button className="composer-send" onClick={sendTextMessage} disabled={isLoading}>
                ➤
              </button>
            ) : (
              <button
                className={`composer-mic ${voiceActive ? 'active' : ''}`}
                onClick={voiceActive ? stopVoiceSession : startVoiceSession}
                title={voiceActive ? 'Stop voice' : 'Start voice'}
              >
                {voiceActive ? '⏹' : '🎙️'}
              </button>
            )}
          </div>
          <div className="composer-footer">
            <span className="composer-security">🔒 Encrypted • Lyka Realty AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
