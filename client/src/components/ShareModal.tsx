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
  const [authType, setAuthType] = useState<'otp' | 'login' | 'none'>('otp');
  const [hiddenDiagnoses, setHiddenDiagnoses] = useState<string[]>([]);
  const [allDiagnoses, setAllDiagnoses] = useState<string[]>(['Diabetes', 'Thyroid Abnormality', 'Hypertension', 'Anemia']);
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
        
        // Extract unique diagnoses if any are present in events/reports
        const diagnosesSet = new Set<string>(['Diabetes', 'Thyroid Abnormality', 'Hypertension', 'Anemia']);
        (rRes.data.reports || []).forEach(r => {
          if (r.reportType) diagnosesSet.add(r.reportType);
        });
        setAllDiagnoses(Array.from(diagnosesSet));
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

  const toggleDiagnosis = (diag: string) => {
    setHiddenDiagnoses(prev =>
      prev.includes(diag) ? prev.filter(d => d !== diag) : [...prev, diag]
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
        authType,
        hiddenDiagnosisTags: hiddenDiagnoses
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
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">🩺 Secure & Granular Selective Sharing</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Shared Successfully!</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>
              Your records have been shared with <strong>{doctorEmail}</strong>. 
              {authType === 'otp' && " The doctor will need to verify with an OTP sent to their email to gain access."}
            </p>
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800">
              ℹ️ <strong>ABHA Consent Compliance:</strong> "We make granular, understandable and auditable sharing simple." Adjust below exactly what the doctor can and cannot see.
            </div>

            {/* Doctor Email */}
            <div>
              <label className="font-semibold text-xs text-secondary uppercase block mb-1">
                Doctor's Email Address *
              </label>
              <input
                type="email"
                className="input text-sm p-2 w-full border rounded"
                placeholder="doctor@hospital.com"
                value={doctorEmail}
                onChange={e => setDoctorEmail(e.target.value)}
              />
            </div>

            {/* Verification type */}
            <div>
              <label className="font-semibold text-xs text-secondary uppercase block mb-1">
                Doctor Verification Method
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-xs flex-1 py-2 ${authType === 'otp' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAuthType('otp')}
                >
                  📧 Require OTP Email
                </button>
                <button
                  type="button"
                  className={`btn btn-xs flex-1 py-2 ${authType === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAuthType('login')}
                >
                  🔒 Verified Login Only
                </button>
                <button
                  type="button"
                  className={`btn btn-xs flex-1 py-2 ${authType === 'none' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAuthType('none')}
                >
                  🔗 Direct Secure Link
                </button>
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="font-semibold text-xs text-secondary uppercase block mb-1">
                Share Expiration Time
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[{ label: '1 hour', value: 1 }, { label: '24 hours', value: 24 }, { label: '7 days', value: 168 }, { label: '30 days', value: 720 }].map(opt => (
                  <button
                    key={opt.value}
                    className={`btn btn-xs ${expiresInHours === opt.value ? 'btn-primary' : 'btn-secondary'}`}
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
              <label className="font-semibold text-xs text-secondary uppercase block mb-1">
                Select Reports to Include
              </label>
              {fetchingData ? (
                <div className="skeleton skeleton-card" style={{ height: '50px' }} />
              ) : reports.length === 0 ? (
                <p className="text-secondary text-sm">No reports uploaded yet.</p>
              ) : (
                <div className="border rounded p-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {reports.map(r => (
                    <label
                      key={r._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.2rem', borderRadius: '4px' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReportIds.includes(r._id)}
                        onChange={() => toggleReport(r._id)}
                      />
                      <span className="text-xs">
                        {r.fileName}
                        <span className="text-xs text-secondary ml-2">({r.reportType || r.processingStatus})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnoses to Hide */}
            <div>
              <label className="font-semibold text-xs text-secondary uppercase block mb-1">
                Hide Unrelated Diagnoses/Tags
              </label>
              <div className="flex flex-wrap gap-2 p-2 border rounded">
                {allDiagnoses.map(diag => (
                  <button
                    type="button"
                    key={diag}
                    onClick={() => toggleDiagnosis(diag)}
                    className={`btn btn-xs ${hiddenDiagnoses.includes(diag) ? 'btn-danger' : 'btn-secondary'}`}
                  >
                    {hiddenDiagnoses.includes(diag) ? `👁️ Hiding ${diag}` : `Show ${diag}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview / Audit Trail */}
            <div className="bg-gray-50 border p-3 rounded text-xs space-y-1">
              <span className="font-semibold text-gray-700 uppercase block mb-1">📋 Doctor Dashboard Visibility Preview</span>
              <div className="flex justify-between">
                <span>Shared Reports Count:</span>
                <span className="font-bold text-green-700">{selectedReportIds.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Hidden Health Diagnoses:</span>
                <span className="font-bold text-red-600">{hiddenDiagnoses.length ? hiddenDiagnoses.join(', ') : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Audit Trail Logged:</span>
                <span className="text-green-600 font-bold">Yes (IP Address & Access Times)</span>
              </div>
            </div>

            {error && (
              <div className="alert alert-error text-sm">{error}</div>
            )}

            <button
              className="btn btn-primary w-full py-2.5"
              onClick={handleShare}
              disabled={loading}
            >
              {loading ? 'Generating Secure Consent...' : '🛡️ Create Secure Shared Access'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}