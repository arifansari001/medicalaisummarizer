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
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: '10px',
      overflow: 'hidden', background: '#fff',
    }}>
      {/* Patient message */}
      <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
          👤 Patient said · {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
          {log.hasAttachment && <span style={{ marginLeft: '8px', color: '#0891b2' }}>📎 attachment</span>}
        </div>
        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>{log.patientMessage}</div>
      </div>

      {/* Bot response */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
          🤖 AI responded
        </div>
        <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{log.botResponse}</div>

        {certCfg && (
          <span style={{
            display: 'inline-block', marginTop: '8px', fontSize: '11px', fontWeight: 700,
            padding: '2px 10px', borderRadius: '999px',
            color: certCfg.color, background: certCfg.bg,
          }}>
            {certCfg.label}
          </span>
        )}

        {log.suggestedSpecialty && (
          <span style={{
            display: 'inline-block', marginTop: '8px', marginLeft: '8px',
            fontSize: '11px', padding: '2px 10px', borderRadius: '999px',
            color: '#4f46e5', background: '#eef2ff', fontWeight: 600,
          }}>
            Specialty: {log.suggestedSpecialty}
          </span>
        )}
      </div>

      {/* Doctor review section */}
      <div style={{ padding: '10px 16px' }}>
        {existingReview ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
            color: existingReview === 'confirmed' ? '#065f46' : '#b91c1c',
          }}>
            {existingReview === 'confirmed' ? '✅ You confirmed this response' : '⚠️ You flagged this response as inaccurate'}
            {log.doctorReview?.note && (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>— "{log.doctorReview.note}"</span>
            )}
            <button
              onClick={() => { setShowNoteInput(false); setPendingStatus(null); setReviewNote(''); onReview(log._id, existingReview === 'confirmed' ? 'flagged' : 'confirmed'); }}
              style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Change
            </button>
          </div>
        ) : showNoteInput ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {pendingStatus === 'confirmed' ? '✅ Confirm this response as accurate' : '⚠️ Flag this response as inaccurate'}
              — add an optional note for the patient:
            </div>
            <input
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Optional correction note..."
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0',
                fontSize: '13px', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={submitReview}
                disabled={submitting}
                style={{
                  padding: '6px 16px', fontSize: '13px', fontWeight: 600,
                  background: pendingStatus === 'confirmed' ? '#10b981' : '#ef4444',
                  color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
                }}
              >
                {submitting ? 'Saving...' : 'Submit Review'}
              </button>
              <button
                onClick={() => setShowNoteInput(false)}
                style={{ padding: '6px 12px', fontSize: '13px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              id={`confirm-log-${log._id}`}
              onClick={() => handleReviewClick('confirmed')}
              style={{
                padding: '5px 14px', fontSize: '12px', fontWeight: 600,
                background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7',
                borderRadius: '6px', cursor: 'pointer',
              }}
            >
              ✅ Confirm
            </button>
            <button
              id={`flag-log-${log._id}`}
              onClick={() => handleReviewClick('flagged')}
              style={{
                padding: '5px 14px', fontSize: '12px', fontWeight: 600,
                background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5',
                borderRadius: '6px', cursor: 'pointer',
              }}
            >
              ⚠️ Flag as Inaccurate
            </button>
          </div>
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
    <div className="doctor-dashboard animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', background: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
        <button style={tabStyle('appointments')} onClick={() => setActiveTab('appointments')}>
          📅 Appointments ({appointments.length})
        </button>
        <button style={tabStyle('records')} onClick={() => setActiveTab('records')}>
          📋 Shared Records ({shares.length})
        </button>
        <button style={tabStyle('conversations')} onClick={() => setActiveTab('conversations')}>
          🤖 AI Conversations
        </button>
      </div>

      {/* ── Appointments tab ── */}
      {activeTab === 'appointments' && (
        <div>
          <h1 className="page-title" style={{ marginBottom: '16px' }}>Upcoming Appointments</h1>
          {appointments.length === 0 ? (
            <p className="empty-state">No upcoming appointments booked.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {appointments.map((apt) => (
                <div key={apt._id} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                  padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{apt.patient?.name || 'Patient'}</h3>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      🗓️ {new Date(apt.date).toLocaleDateString()} | ⏰ {apt.timeSlot}
                    </div>
                    <div style={{ marginTop: '8px', color: '#334155', fontSize: '14px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <strong>Reason:</strong> {apt.reason}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${apt.status}`}>{apt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Shared Records tab ── */}
      {activeTab === 'records' && (
        <div>
          <h1 className="page-title" style={{ marginBottom: '16px' }}>Shared Records from Patients</h1>
          {shares.length === 0 ? (
            <p className="empty-state">No shares have been granted to you yet.</p>
          ) : (
            <div className="share-grid">
              {shares.map((share) => (
                <div key={share._id} className="share-card" onClick={() => handleView(share._id)}>
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

      {/* ── AI Conversations tab ── */}
      {activeTab === 'conversations' && (
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>Patient AI Conversations</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
            Review what the AI assistant told your patients. Mark responses as <strong>Confirmed</strong> (accurate) or <strong>Flagged</strong> (inaccurate) — your review is shown to the patient the next time they view that conversation.
          </p>

          {/* Patient selector — drawn from shared records */}
          {shares.length === 0 ? (
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '24px', textAlign: 'center', color: '#64748b',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
              <p>No patients have shared records with you yet. Once a patient shares their records, you'll be able to review their AI conversations here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Patient list */}
              <div style={{ minWidth: '200px', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Select Patient
                </div>
                {shares.map(share => {
                  const patient = share.patientId as any;
                  const patientId = typeof share.patientId === 'string' ? share.patientId : patient?._id;
                  const patientName = patient?.name || 'Patient';
                  const isSelected = selectedPatientId === patientId;
                  return (
                    <button
                      key={share._id}
                      onClick={() => loadChatLogs(patientId, patientName)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', marginBottom: '6px',
                        background: isSelected ? '#ecfeff' : '#fff',
                        border: `1.5px solid ${isSelected ? '#0891b2' : '#e2e8f0'}`,
                        borderRadius: '8px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#0e7490' : '#334155',
                        transition: 'all 0.15s',
                      }}
                    >
                      👤 {patientName}
                    </button>
                  );
                })}
              </div>

              {/* Chat log list */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                {!selectedPatientId ? (
                  <div style={{
                    background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '10px',
                    padding: '32px', textAlign: 'center', color: '#94a3b8',
                  }}>
                    Select a patient on the left to view their AI conversations
                  </div>
                ) : logsLoading ? (
                  <div className="skeleton skeleton-card" />
                ) : chatLogs.length === 0 ? (
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                    padding: '24px', textAlign: 'center', color: '#64748b',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                    <p>{selectedPatientName} has not had any AI-assisted health conversations yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      {chatLogs.length} AI conversation{chatLogs.length !== 1 ? 's' : ''} with {selectedPatientName} (most recent first)
                    </div>
                    {chatLogs.map(log => (
                      <ChatLogItem key={log._id} log={log} onReview={handleReview} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
