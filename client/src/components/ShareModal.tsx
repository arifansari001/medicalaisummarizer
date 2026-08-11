import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Report, MedicalEvent } from '../types';

interface ShareModalProps {
  onClose: () => void;
}

export default function ShareModal({ onClose }: ShareModalProps) {
  const [doctorEmail, setDoctorEmail] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(720);
  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [rRes, eRes] = await Promise.all([
          api.get<{ reports: Report[] }>('/reports'),
          api.get<{ events: MedicalEvent[] }>('/medical-events'),
        ]);
        setReports(rRes.data.reports || []);
        setEvents(eRes.data.events || []);
      } catch (err) {
        console.error('Failed to load data for sharing', err);
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  const toggleReport = (id: string) => {
    setSelectedReportIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleEvent = (id: string) => {
    setSelectedEventIds(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleShare = async () => {
    if (!doctorEmail.trim()) {
      setError("Please enter the doctor's email address.");
      return;
    }
    if (selectedReportIds.length === 0 && selectedEventIds.length === 0) {
      setError('Please select at least one report or medical event to share.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/shares', {
        doctorEmail: doctorEmail.trim().toLowerCase(),
        sharedReportIds: selectedReportIds,
        sharedEventIds: selectedEventIds,
        expiresInHours,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">🩺 Share with Your Doctor</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Shared Successfully!</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>
              Your records have been shared with <strong>{doctorEmail}</strong>. They will see
              these records when they log in to their Doctor Dashboard.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Doctor Email */}
            <div>
              <label className="font-semibold text-sm" style={{ display: 'block', marginBottom: '0.4rem' }}>
                Doctor's Email *
              </label>
              <input
                type="email"
                className="input"
                placeholder="doctor@hospital.com"
                value={doctorEmail}
                onChange={e => setDoctorEmail(e.target.value)}
              />
              <p className="text-xs text-secondary" style={{ marginTop: '0.3rem' }}>
                The doctor must have a registered account with this email.
              </p>
            </div>

            {/* Expiry */}
            <div>
              <label className="font-semibold text-sm" style={{ display: 'block', marginBottom: '0.4rem' }}>
                Access Expires In
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[{ label: '1 hour', value: 1 }, { label: '7 days', value: 168 }, { label: '14 days', value: 336 }, { label: '30 days', value: 720 }].map(opt => (
                  <button
                    key={opt.value}
                    className={`btn btn-sm ${expiresInHours === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setExpiresInHours(opt.value)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports */}
            <div>
              <label className="font-semibold text-sm" style={{ display: 'block', marginBottom: '0.4rem' }}>
                Select Reports to Share
              </label>
              {fetchingData ? (
                <div className="skeleton skeleton-card" style={{ height: '60px' }} />
              ) : reports.length === 0 ? (
                <p className="text-secondary text-sm">No reports uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {reports.map(r => (
                    <label
                      key={r._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', background: selectedReportIds.includes(r._id) ? 'var(--color-accent-light, #e8f0fe)' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReportIds.includes(r._id)}
                        onChange={() => toggleReport(r._id)}
                      />
                      <span className="text-sm">
                        {r.fileName}
                        <span className="text-xs text-secondary" style={{ marginLeft: '0.4rem' }}>
                          ({r.reportType || r.processingStatus})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Events */}
            <div>
              <label className="font-semibold text-sm" style={{ display: 'block', marginBottom: '0.4rem' }}>
                Select Medical Events to Share
              </label>
              {fetchingData ? (
                <div className="skeleton skeleton-card" style={{ height: '60px' }} />
              ) : events.length === 0 ? (
                <p className="text-secondary text-sm">No medical events recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {events.map(e => (
                    <label
                      key={e._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', background: selectedEventIds.includes(e._id) ? 'var(--color-accent-light, #e8f0fe)' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEventIds.includes(e._id)}
                        onChange={() => toggleEvent(e._id)}
                      />
                      <span className="text-sm">
                        {e.title}
                        <span className="text-xs text-secondary" style={{ marginLeft: '0.4rem' }}>
                          ({new Date(e.date).toLocaleDateString()})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error text-sm">{error}</div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleShare}
              disabled={loading}
            >
              {loading ? 'Sharing...' : '🔗 Share Records'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}