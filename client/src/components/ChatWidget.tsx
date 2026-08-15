import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type CertaintyLevel = 'well_established' | 'worth_confirming' | 'seek_professional' | 'emergency' | null;

interface DoctorCard {
  _id: string;
  name: string;
  specialty: string;
  rating: number;
  consultationFee: number;
  clinicName: string;
  location?: { address: string };
}

interface StoreCard {
  _id: string;
  name: string;
  type: 'pharmacy' | 'blood_bank';
  location?: { address: string };
  phone?: string;
  medicineInventory?: string[];
  bloodGroups?: string[];
}

interface BotMessage {
  role: 'patient' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  certaintyLevel?: CertaintyLevel;
  suggestedSpecialty?: string;
  queryType?: string;
  doctors?: DoctorCard[];
  stores?: StoreCard[];
  isEmergency?: boolean;
  doctorFlag?: {
    status: 'confirmed' | 'flagged';
    note?: string;
    doctorName?: string;
  } | null;
  logId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CERTAINTY_CONFIG: Record<NonNullable<CertaintyLevel>, { label: string; color: string; bg: string }> = {
  well_established: { label: 'Well-established', color: '#065f46', bg: '#d1fae5' },
  worth_confirming: { label: 'Worth confirming with doctor', color: '#92400e', bg: '#fef3c7' },
  seek_professional: { label: 'Please consult a doctor', color: '#1e40af', bg: '#dbeafe' },
  emergency:        { label: '🚨 EMERGENCY — Call 112 Now', color: '#fff', bg: '#dc2626' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CertaintyBadge({ level }: { level: CertaintyLevel }) {
  if (!level) return null;
  const cfg = CERTAINTY_CONFIG[level];
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: '999px',
      color: cfg.color,
      background: cfg.bg,
      marginTop: '6px',
      letterSpacing: '0.02em',
    }}>
      {cfg.label}
    </span>
  );
}

function DoctorResultCard({ doctor, onBook }: { doctor: DoctorCard; onBook: (d: DoctorCard) => void }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px',
      padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: '8px', cursor: 'pointer',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(8,145,178,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #0891b2, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '15px',
        }}>
          {doctor.name.charAt(4) || 'D'}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{doctor.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{doctor.clinicName}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>📍 {doctor.location?.address || 'Lucknow'}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', color: '#f59e0b' }}>{'★'.repeat(Math.round(doctor.rating))}</div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2' }}>₹{doctor.consultationFee}</div>
        <button
          onClick={() => onBook(doctor)}
          style={{
            marginTop: '4px', fontSize: '11px', padding: '3px 10px',
            background: '#0891b2', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Book
        </button>
      </div>
    </div>
  );
}

function StoreResultCard({ store }: { store: StoreCard }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px',
      padding: '12px 14px', fontSize: '13px',
    }}>
      <div style={{ fontWeight: 600, color: '#0f172a' }}>
        {store.type === 'pharmacy' ? '💊' : '🩸'} {store.name}
      </div>
      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
        📍 {store.location?.address}
        {store.phone && <> · 📞 {store.phone}</>}
      </div>
      {store.medicineInventory && store.medicineInventory.length > 0 && (
        <div style={{ marginTop: '4px', color: '#334155', fontSize: '11px' }}>
          In stock: {store.medicineInventory.slice(0, 5).join(', ')}
        </div>
      )}
      {store.bloodGroups && store.bloodGroups.length > 0 && (
        <div style={{ marginTop: '4px', color: '#dc2626', fontSize: '11px' }}>
          Available blood types: {store.bloodGroups.join(', ')}
        </div>
      )}
    </div>
  );
}

// ─── Main ChatWidget ───────────────────────────────────────────────────────────

interface ChatWidgetProps {
  initialContext?: string; // e.g. diagnoses from a report
}

const CONSENT_KEY = 'medsummary_chat_consented';

export default function ChatWidget({ initialContext }: ChatWidgetProps) {
  const navigate = useNavigate();
  const [consented, setConsented] = useState(() => localStorage.getItem(CONSENT_KEY) === 'true');
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Welcome message after consent
  useEffect(() => {
    if (consented && messages.length === 0) {
      const welcome: BotMessage = {
        role: 'bot',
        content: initialContext
          ? `Hello! I can see you've had a recent medical report reviewed. Based on that, I'm ready to help answer questions or guide you to the right doctor. Remember, I provide educational information only — always confirm with your doctor.\n\nWhat would you like to know?`
          : `Hello! I'm your MedSummary AI health assistant. Tell me how you're feeling, describe your symptoms, ask about a medicine, or ask about blood availability. I'll do my best to guide you.\n\nWhat would you like to ask?`,
        timestamp: new Date(),
        certaintyLevel: null,
      };
      setMessages([welcome]);
    }
  }, [consented, initialContext]);

  const handleConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setConsented(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;

    const userMsg: BotMessage = {
      role: 'patient',
      content: text || `[Attached file: ${attachedFile?.name}]`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsTyping(true);
    setError(null);

    try {
      // Build FormData to support file upload
      const formData = new FormData();
      if (text) formData.append('message', text);
      if (attachedFile) formData.append('image', attachedFile);
      // Send last 6 messages as context (exclude system/emergency messages)
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));
      formData.append('history', JSON.stringify(history));

      const res = await api.post('/chat/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data as {
        content: string;
        certaintyLevel: CertaintyLevel;
        suggestedSpecialty?: string;
        queryType?: string;
        doctors?: DoctorCard[];
        stores?: StoreCard[];
        isEmergency?: boolean;
        logId?: string;
      };

      const botMsg: BotMessage = {
        role: 'bot',
        content: data.content,
        timestamp: new Date(),
        certaintyLevel: data.certaintyLevel,
        suggestedSpecialty: data.suggestedSpecialty,
        queryType: data.queryType,
        doctors: data.doctors,
        stores: data.stores,
        isEmergency: data.isEmergency,
        logId: data.logId,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [input, attachedFile, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBookDoctor = (doctor: DoctorCard) => {
    navigate('/doctors', { state: { preselect: doctor._id } });
  };

  // ── Consent Gate ─────────────────────────────────────────────────────────────
  if (!consented) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: '24px',
        padding: '32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '56px' }}>🤝</div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Before we begin
          </h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, maxWidth: '440px' }}>
            This AI assistant provides <strong>general health information only</strong>. It is not a diagnostic tool
            and cannot replace professional medical advice, examination, or treatment.
          </p>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.7, maxWidth: '440px', marginTop: '10px' }}>
            In a <strong>medical emergency</strong>, please call <strong>112</strong> or go to your nearest emergency room immediately.
          </p>
        </div>
        <div style={{
          background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px',
          padding: '14px 20px', maxWidth: '440px', fontSize: '13px', color: '#92400e', textAlign: 'left',
        }}>
          ⚠️ By proceeding, you acknowledge you have read and understood these limitations. All information
          provided should be verified with a qualified healthcare professional.
        </div>
        <button
          id="chat-consent-btn"
          onClick={handleConsent}
          style={{
            padding: '14px 40px', background: 'linear-gradient(135deg, #0891b2, #6366f1)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          I Understand — Start Chat
        </button>
      </div>
    );
  }

  // ── Main Chat UI ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Permanent Safety Banner */}
      <div style={{
        background: '#fff7ed', borderBottom: '1px solid #fed7aa',
        padding: '8px 16px', fontSize: '12px', color: '#c2410c',
        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
      }}>
        <span>⚠️</span>
        <span>
          <strong>General information only — not medical advice.</strong> Always confirm with a qualified doctor.
          In an emergency, call <strong>112</strong> immediately.
        </span>
      </div>

      {/* Message Thread */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: msg.role === 'patient' ? 'row-reverse' : 'row',
            gap: '10px', alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'patient'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #0891b2, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px', fontWeight: 700,
            }}>
              {msg.role === 'patient' ? '👤' : '🤖'}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '75%' }}>

              {/* Emergency Alert */}
              {msg.isEmergency && (
                <div style={{
                  background: '#dc2626', color: '#fff', borderRadius: '10px',
                  padding: '14px 18px', fontWeight: 700, fontSize: '15px',
                  marginBottom: '8px', lineHeight: 1.5,
                }}>
                  🚨 POTENTIAL EMERGENCY — Stop and call <strong>112</strong> or go to the nearest emergency room right away.
                  Do not wait for online advice.
                </div>
              )}

              {/* Message bubble */}
              <div style={{
                background: msg.role === 'patient' ? '#6366f1' : '#f8fafc',
                color: msg.role === 'patient' ? '#fff' : '#1e293b',
                border: msg.role === 'patient' ? 'none' : '1px solid #e2e8f0',
                borderRadius: msg.role === 'patient' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                padding: '12px 16px', fontSize: '14px', lineHeight: 1.65,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>

              {/* Certainty badge */}
              {msg.role === 'bot' && msg.certaintyLevel && (
                <CertaintyBadge level={msg.certaintyLevel} />
              )}

              {/* Doctor flag from doctor review */}
              {msg.doctorFlag && (
                <div style={{
                  marginTop: '6px', padding: '8px 12px', borderRadius: '8px',
                  fontSize: '12px',
                  background: msg.doctorFlag.status === 'confirmed' ? '#d1fae5' : '#fee2e2',
                  color: msg.doctorFlag.status === 'confirmed' ? '#065f46' : '#b91c1c',
                  borderLeft: `3px solid ${msg.doctorFlag.status === 'confirmed' ? '#10b981' : '#ef4444'}`,
                }}>
                  {msg.doctorFlag.status === 'confirmed'
                    ? `✅ Confirmed by Dr. ${msg.doctorFlag.doctorName || 'your doctor'}`
                    : `⚠️ Flagged by Dr. ${msg.doctorFlag.doctorName || 'your doctor'}`}
                  {msg.doctorFlag.note && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>Note: {msg.doctorFlag.note}</div>}
                </div>
              )}

              {/* Inline Doctor Results */}
              {msg.doctors && msg.doctors.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: '#64748b',
                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    👨‍⚕️ Nearby {msg.suggestedSpecialty} Specialists
                    <span style={{ fontWeight: 400, marginLeft: '6px', color: '#94a3b8' }}>
                      (Demo data — not a real directory)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {msg.doctors.map(d => (
                      <DoctorResultCard key={d._id} doctor={d} onBook={handleBookDoctor} />
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/doctors')}
                    style={{
                      marginTop: '8px', width: '100%', padding: '8px',
                      background: 'transparent', border: '1.5px dashed #0891b2',
                      borderRadius: '8px', color: '#0891b2', fontWeight: 600,
                      fontSize: '12px', cursor: 'pointer',
                    }}
                  >
                    Browse Full Doctor Directory →
                  </button>
                </div>
              )}

              {/* Inline Store Results */}
              {msg.stores && msg.stores.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700, color: '#64748b',
                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    🏥 Nearby Stores
                    <span style={{ fontWeight: 400, marginLeft: '6px', color: '#94a3b8' }}>
                      (Mock demo inventory — not live stock)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {msg.stores.map(s => <StoreResultCard key={s._id} store={s} />)}
                  </div>
                  <button
                    onClick={() => navigate('/stores')}
                    style={{
                      marginTop: '8px', width: '100%', padding: '8px',
                      background: 'transparent', border: '1.5px dashed #0891b2',
                      borderRadius: '8px', color: '#0891b2', fontWeight: 600,
                      fontSize: '12px', cursor: 'pointer',
                    }}
                  >
                    Browse All Medical Stores →
                  </button>
                </div>
              )}

              {/* Timestamp */}
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: msg.role === 'patient' ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '14px',
            }}>🤖</div>
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
            }}>
              <span className="chat-typing-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '10px 14px', color: '#b91c1c', fontSize: '13px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        borderTop: '1px solid #e2e8f0', padding: '12px 16px',
        background: '#fff', flexShrink: 0,
      }}>
        {attachedFile && (
          <div style={{
            marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px',
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
            padding: '6px 10px', fontSize: '13px', color: '#0369a1',
          }}>
            <span>📎 {attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0 4px' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          {/* File upload button */}
          <button
            id="chat-attach-btn"
            title="Attach a medical report image"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '38px', height: '38px', border: '1.5px solid #e2e8f0',
              borderRadius: '8px', background: '#f8fafc', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', flexShrink: 0, color: '#64748b',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#0891b2')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Text input */}
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms or ask a question... (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '8px',
              border: '1.5px solid #e2e8f0', fontSize: '14px',
              fontFamily: 'inherit', resize: 'none', outline: 'none',
              transition: 'border-color 0.2s', lineHeight: 1.5,
              background: '#f8fafc',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#0891b2')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />

          {/* Send button */}
          <button
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={isTyping || (!input.trim() && !attachedFile)}
            style={{
              width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
              background: isTyping || (!input.trim() && !attachedFile)
                ? '#e2e8f0' : 'linear-gradient(135deg, #0891b2, #6366f1)',
              color: isTyping || (!input.trim() && !attachedFile) ? '#94a3b8' : '#fff',
              border: 'none', cursor: isTyping || (!input.trim() && !attachedFile) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', transition: 'background 0.2s',
            }}
          >
            {isTyping ? '⏳' : '➤'}
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
          All conversations are logged for your doctor to review. Press Enter to send.
        </div>
      </div>
    </div>
  );
}
