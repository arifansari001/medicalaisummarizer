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

function ChatLogItem({ log, onReview }: {
  log: ChatLogEntry;
  onReview: (logId: string, status: 'confirmed' | 'flagged', note?: string) => void;
}) {
  const [reviewNote, setReviewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'confirmed' | 'flagged' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const certCfg = log.certaintyLevel ? CERTAINTY_LABELS[log.certaintyLevel] : null;
  const existingReview = log.doctorReview?.status;

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

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Patient message header */}
      <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0891b2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>P</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Patient</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
            {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          {log.hasAttachment && <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>📎 Attachment</span>}
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>{log.patientMessage}</p>
      </div>

      {/* AI response body */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>🤖</span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>AI Response</span>
          {certCfg && (
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: certCfg.bg, color: certCfg.color, fontWeight: 600, marginLeft: 'auto' }}>
              {certCfg.label}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{log.botResponse}</p>

        {/* Review actions */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {existingReview ? (
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', background: existingReview === 'confirmed' ? '#d1fae5' : '#fee2e2', color: existingReview === 'confirmed' ? '#065f46' : '#b91c1c' }}>
              {existingReview === 'confirmed' ? '✅ Confirmed by you' : '⚠️ Flagged by you'}
            </span>
          ) : (
            <>
              <button onClick={() => handleReviewClick('confirmed')} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: '6px', cursor: 'pointer' }}>
                ✅ Confirm Accurate
              </button>
              <button onClick={() => handleReviewClick('flagged')} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 600, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>
                ⚠️ Flag as Inaccurate
              </button>
            </>
          )}
        </div>

        {showNoteInput && (
          <div style={{ marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <textarea
              placeholder="Add an optional note for the patient (optional)..."
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={submitReview} disabled={submitting} style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, background: pendingStatus === 'confirmed' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                {submitting ? 'Saving...' : 'Submit Review'}
              </button>
              <button onClick={() => setShowNoteInput(false)} style={{ padding: '6px 14px', fontSize: '13px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flex: 1, minWidth: '140px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{label}</div>
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
    if (selectedPatientId) {
      const res = await api.get<{ logs: ChatLogEntry[] }>(`/chat/logs/${selectedPatientId}`);
      setChatLogs(res.data.logs);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  // Tab config
  const tabs = [
    { key: 'appointments', label: 'Appointments', icon: '📅', count: appointments.length },
    { key: 'records',      label: 'Shared Records', icon: '📋', count: shares.length },
    { key: 'conversations', label: 'AI Conversations', icon: '🤖', count: null },
  ] as const;

  const emergencyCount = shares.reduce((acc: number) => acc, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 60%, #6366f1 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        boxShadow: '0 8px 24px rgba(8, 145, 178, 0.25)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.75, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doctor Portal</div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Welcome, Doctor 👨‍⚕️</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: '14px' }}>Review patient records, appointments and AI health conversations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{appointments.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Appointments</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{shares.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Shared Records</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <StatCard icon="📅" label="Upcoming Appointments" value={appointments.length} color="#dbeafe" />
        <StatCard icon="📋" label="Patient Records Shared" value={shares.length} color="#d1fae5" />
        <StatCard icon="💬" label="AI Conversations" value={shares.length > 0 ? shares.length : 0} color="#ede9fe" />
        <StatCard icon="🚨" label="Emergency Flags" value={emergencyCount} color="#fee2e2" />
      </div>

      {/* Tab Navigation */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: activeTab === tab.key ? '#f0f9ff' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2.5px solid #0891b2' : '2.5px solid transparent',
                color: activeTab === tab.key ? '#0891b2' : '#64748b',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon} {tab.label}
              {tab.count !== null && (
                <span style={{ background: activeTab === tab.key ? '#0891b2' : '#e2e8f0', color: activeTab === tab.key ? '#fff' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* ── Appointments Tab ─────────────────────────────────────────────── */}
          {activeTab === 'appointments' && (
            <>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>📅 Upcoming Appointments</h2>
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <h3 style={{ color: '#334155', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>No Appointments Yet</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>When patients book appointments with you, they'll appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {appointments.map(apt => (
                    <div key={apt._id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                          {(apt.patient?.name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{apt.patient?.name || 'Patient'}</div>
                          <div style={{ color: '#64748b', fontSize: '13px' }}>🗓️ {new Date(apt.date).toLocaleDateString()} · ⏰ {apt.timeSlot}</div>
                          {apt.reason && <div style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>📝 {apt.reason}</div>}
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: apt.status === 'confirmed' ? '#d1fae5' : apt.status === 'pending' ? '#fef3c7' : '#f1f5f9', color: apt.status === 'confirmed' ? '#065f46' : apt.status === 'pending' ? '#92400e' : '#475569' }}>
                        {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Shared Records Tab ───────────────────────────────────────────── */}
          {activeTab === 'records' && (
            <>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>📋 Patient Shared Records</h2>
              {shares.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
                  <h3 style={{ color: '#334155', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>No Records Shared Yet</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>When patients share their records with your email, they'll appear here for secure review.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {shares.map(share => (
                    <div
                      key={share._id}
                      onClick={() => navigate(`/doctor/share/${share._id}`)}
                      style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(8,145,178,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = '#0891b2'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                          {((share.patientId as any)?.name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{(share.patientId as any)?.name ?? 'Unknown Patient'}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{share.doctorEmail}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>⏰ Expires {new Date(share.expiresAt).toLocaleDateString()}</span>
                        {share.revokedAt
                          ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>Revoked</span>
                          : <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: '#d1fae5', color: '#065f46', fontWeight: 700 }}>Active</span>
                        }
                      </div>
                      <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0891b2' }}>View Records →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── AI Conversations Tab ─────────────────────────────────────────── */}
          {activeTab === 'conversations' && (
            <>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>🤖 Patient AI Conversations</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.5 }}>
                Review what the AI assistant told your patients. Mark responses as <strong>Confirmed</strong> (accurate) or <strong>Flagged</strong> (inaccurate).
              </p>

              {shares.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                  <h3 style={{ color: '#334155', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px' }}>No Patients Yet</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Once patients share their records with you, AI conversations appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '16px', minHeight: '400px' }}>
                  {/* Patient List */}
                  <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Select Patient</div>
                    {shares.map(share => {
                      const patient = share.patientId as any;
                      const patientId = typeof share.patientId === 'string' ? share.patientId : patient?._id;
                      const patientName = patient?.name || 'Patient';
                      const isSelected = selectedPatientId === patientId;
                      return (
                        <button
                          key={share._id}
                          onClick={() => loadChatLogs(patientId, patientName)}
                          style={{ padding: '10px 12px', borderRadius: '8px', border: isSelected ? '1.5px solid #0891b2' : '1.5px solid #e2e8f0', background: isSelected ? '#e0f2fe' : '#f8fafc', color: isSelected ? '#0c4a6e' : '#334155', fontWeight: isSelected ? 700 : 500, fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                            {patientName[0].toUpperCase()}
                          </span>
                          {patientName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Conversation Panel */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!selectedPatientId ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px', color: '#94a3b8', padding: '40px' }}>
                        <div style={{ fontSize: '40px' }}>👈</div>
                        <p style={{ fontSize: '14px', textAlign: 'center', margin: 0 }}>Select a patient on the left to view their AI conversations</p>
                      </div>
                    ) : logsLoading ? (
                      <div className="skeleton skeleton-card" />
                    ) : chatLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>{selectedPatientName} hasn't had any AI conversations yet.</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '12px', padding: '8px 12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                          💬 {chatLogs.length} AI conversation{chatLogs.length !== 1 ? 's' : ''} with {selectedPatientName}
                        </div>
                        <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                          {chatLogs.map(log => (
                            <ChatLogItem key={log._id} log={log} onReview={handleReview} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
