import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ShareRecord } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatLogEntry {
  _id: string;
  patientMessage: string;
  botResponse: string;
  certaintyLevel: 'well_established' | 'worth_confirming' | 'seek_professional' | 'emergency' | null;
  suggestedSpecialty?: string | null;
  queryType?: string;
  isEmergency?: boolean;
  hasAttachment?: boolean;
  createdAt: string;
  doctorReview?: {
    status: 'confirmed' | 'flagged' | null;
    note?: string | null;
    reviewedAt?: string | null;
  };
}

const CERTAINTY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  well_established:  { label: 'Well-established',            color: '#065f46', bg: '#d1fae5' },
  worth_confirming:  { label: 'Worth confirming with doctor', color: '#92400e', bg: '#fef3c7' },
  seek_professional: { label: 'Please consult a doctor',      color: '#1e40af', bg: '#dbeafe' },
  emergency:         { label: '🚨 Emergency escalation',      color: '#fff',    bg: '#dc2626' },
};

// ─── Chat Log Item ─────────────────────────────────────────────────────────────

function ChatLogItem({ log, onReview }: {
  log: ChatLogEntry;
  onReview: (logId: string, status: 'confirmed' | 'flagged', note?: string) => void;
}) {
  const [reviewNote, setReviewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'confirmed' | 'flagged' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const certCfg = log.certaintyLevel ? CERTAINTY_LABELS[log.certaintyLevel] : null;

  const handleReviewClick = (status: 'confirmed' | 'flagged') => {
    setPendingStatus(status);
    setShowNoteInput(true);
  };

  const submitReview = async () => {
    if (!pendingStatus) return;
    setSubmitting(true);
    try {
      await onReview(log._id, pendingStatus, reviewNote || undefined);
      setShowNoteInput(false);
    } finally {
      setSubmitting(false);
    }
  };

  const existingReview = log.doctorReview?.status;

  return (
    <div className="chat-log-card">
      <div className="chat-log-header">
        <div className="chat-log-meta">
          👤 Patient said · {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
          {log.hasAttachment && <span style={{ marginLeft: '8px', color: '#dbeafe' }}>📎 attachment</span>}
        </div>
        <div className="chat-log-body" style={{ padding: '0', border: 'none' }}>{log.patientMessage}</div>
      </div>

      <div className="chat-log-body">
        <div className="chat-log-meta">🤖 AI responded</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{log.botResponse}</div>

        <div className="chat-log-badges">
          {certCfg && (
            <span className="chat-log-badge" style={{ color: certCfg.color, background: certCfg.bg }}>
              {certCfg.label}
            </span>
          )}

          {log.suggestedSpecialty && (
            <span className="chat-log-badge" style={{ color: '#dbeafe', background: 'rgba(59,130,246,0.18)' }}>
              Specialty: {log.suggestedSpecialty}
            </span>
          )}
        </div>
      </div>

      <div className="chat-log-actions">
        {existingReview ? (
          <>
            <div className="doctor-note">
              {existingReview === 'confirmed' ? '✅ You confirmed this response' : '⚠️ You flagged this response as inaccurate'}
              {log.doctorReview?.note && <span> — "{log.doctorReview.note}"</span>}
            </div>
            <button
              className="doctor-toggle"
              onClick={() => { setShowNoteInput(false); setPendingStatus(null); setReviewNote(''); onReview(log._id, existingReview === 'confirmed' ? 'flagged' : 'confirmed'); }}
            >
              Change
            </button>
          </>
        ) : showNoteInput ? (
          <div className="review-panel">
            <div className="doctor-note">
              {pendingStatus === 'confirmed' ? '✅ Confirm this response as accurate' : '⚠️ Flag this response as inaccurate'} — add an optional note for the patient:
            </div>
            <input
              className="review-input"
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Optional correction note..."
            />
            <div className="review-row">
              <button
                className={`review-button ${pendingStatus === 'confirmed' ? 'confirm' : 'flag'}`}
                onClick={submitReview}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Submit Review'}
              </button>
              <button
                className="review-button"
                onClick={() => setShowNoteInput(false)}
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-silver-mist)', borderColor: 'rgba(139,199,198,0.18)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              id={`confirm-log-${log._id}`}
              className="review-button confirm"
              onClick={() => handleReviewClick('confirmed')}
            >
              ✅ Confirm
            </button>
            <button
              id={`flag-log-${log._id}`}
              className="review-button flag"
              onClick={() => handleReviewClick('flagged')}
            >
              ⚠️ Flag as Inaccurate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorDashboardPage() {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'records' | 'conversations'>('appointments');
  const navigate = useNavigate();

  // Chat logs state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [chatLogs, setChatLogs] = useState<ChatLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sharesRes, appointmentsRes] = await Promise.all([
          api.get<{ shares: ShareRecord[] }>('/shares/doctor'),
          api.get<{ appointments: any[] }>('/appointments/doctor'),
        ]);
        setShares(sharesRes.data.shares);
        setAppointments(appointmentsRes.data.appointments);
      } catch (err) {
        console.error('Failed to load doctor dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleView = (shareId: string) => {
    navigate(`/doctor/share/${shareId}`);
  };

  const loadChatLogs = async (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setLogsLoading(true);
    try {
      const res = await api.get<{ logs: ChatLogEntry[] }>(`/chat/logs/${patientId}`);
      setChatLogs(res.data.logs);
    } catch (err) {
      console.error('Failed to load chat logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleReview = async (logId: string, status: 'confirmed' | 'flagged', note?: string) => {
    await api.patch(`/chat/logs/${logId}/review`, { status, note });
    // Refresh logs
    if (selectedPatientId) {
      const res = await api.get<{ logs: ChatLogEntry[] }>(`/chat/logs/${selectedPatientId}`);
      setChatLogs(res.data.logs);
    }
  };

  if (loading) return <div className="skeleton skeleton-card" />;

  const tabStyle = (tab: string) => ({
    padding: '10px 20px',
    background: 'transparent',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #0891b2' : '2px solid transparent',
    color: activeTab === tab ? '#0891b2' : '#64748b',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  });

  return (
    <div className="doctor-dashboard animate-fade-in">
      <div className="doctor-tabs">
        <button className={`doctor-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
          📅 Appointments ({appointments.length})
        </button>
        <button className={`doctor-tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          📋 Shared Records ({shares.length})
        </button>
        <button className={`doctor-tab ${activeTab === 'conversations' ? 'active' : ''}`} onClick={() => setActiveTab('conversations')}>
          🤖 AI Conversations
        </button>
      </div>

      {activeTab === 'appointments' && (
        <div className="doctor-panel-card">
          <h1 className="doctor-section-title">Upcoming Appointments</h1>
          {appointments.length === 0 ? (
            <p className="doctor-empty-panel">No upcoming appointments booked.</p>
          ) : (
            <div className="doctor-list">
              {appointments.map((apt) => (
                <div key={apt._id} className="doctor-appointment-card">
                  <div className="doctor-appointment-top">
                    <div>
                      <h3>{apt.patient?.name || 'Patient'}</h3>
                      <div className="doctor-meta">
                        🗓️ {new Date(apt.date).toLocaleDateString()} | ⏰ {apt.timeSlot}
                      </div>
                    </div>
                    <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                  </div>
                  <div className="doctor-reason">
                    <strong>Reason:</strong> {apt.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="doctor-panel-card">
          <h1 className="doctor-section-title">Shared Records from Patients</h1>
          {shares.length === 0 ? (
            <p className="doctor-empty-panel">No shares have been granted to you yet.</p>
          ) : (
            <div className="share-grid">
              {shares.map((share) => (
                <div key={share._id} className="doctor-share-card" onClick={() => handleView(share._id)}>
                  <h3 className="share-patient-name">Patient: {(share.patientId as any)?.name ?? 'Unknown'}</h3>
                  <p className="share-doctor-email">Shared by: {share.doctorEmail}</p>
                  <p className="share-expires">Expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
                  {share.revokedAt && <p className="share-revoked">Revoked</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'conversations' && (
        <div className="doctor-panel-card">
          <h1 className="doctor-section-title">Patient AI Conversations</h1>
          <p className="doctor-summary-copy">
            Review what the AI assistant told your patients. Mark responses as <strong>Confirmed</strong> (accurate) or <strong>Flagged</strong> (inaccurate) — your review is shown to the patient the next time they view that conversation.
          </p>

          {shares.length === 0 ? (
            <div className="doctor-empty-panel">
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
              <p>No patients have shared records with you yet. Once a patient shares their records, you'll be able to review their AI conversations here.</p>
            </div>
          ) : (
            <div className="conversation-layout">
              <div className="conversation-patient-list">
                <div className="conversation-patient-list-label">Select Patient</div>
                {shares.map(share => {
                  const patient = share.patientId as any;
                  const patientId = typeof share.patientId === 'string' ? share.patientId : patient?._id;
                  const patientName = patient?.name || 'Patient';
                  const isSelected = selectedPatientId === patientId;
                  return (
                    <button
                      key={share._id}
                      className={`conversation-patient-button ${isSelected ? 'active' : ''}`}
                      onClick={() => loadChatLogs(patientId, patientName)}
                    >
                      👤 {patientName}
                    </button>
                  );
                })}
              </div>

              <div className="conversation-panel">
                {!selectedPatientId ? (
                  <div className="doctor-empty-panel">
                    Select a patient on the left to view their AI conversations
                  </div>
                ) : logsLoading ? (
                  <div className="skeleton skeleton-card" />
                ) : chatLogs.length === 0 ? (
                  <div className="doctor-empty-panel">
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                    <p>{selectedPatientName} has not had any AI-assisted health conversations yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="conversation-summary">
                      {chatLogs.length} AI conversation{chatLogs.length !== 1 ? 's' : ''} with {selectedPatientName} (most recent first)
                    </div>
                    {chatLogs.map(log => (
                      <ChatLogItem key={log._id} log={log} onReview={handleReview} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
