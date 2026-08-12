import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  rating: number;
  consultationFee: number;
  clinicName: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
}

interface ChatbotModalProps {
  diagnoses: string[];
  onClose: () => void;
}

export default function ChatbotModal({ diagnoses, onClose }: ChatbotModalProps) {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'doctor' | 'store'>('doctor');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    explanation: string;
    specialty: string;
    recommendedDoctors: Doctor[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoute = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post('/chat/route', { symptoms });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#e2e8f0' }}>★</span>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '650px',
          width: '90%',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', background: 'linear-gradient(135deg, #0891b2, #6366f1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 AI Triage & Directory
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Tell me how you're feeling, and I'll find the right help for you.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('doctor')}
            style={{
              flex: 1, padding: '12px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'doctor' ? '2px solid #0891b2' : '2px solid transparent',
              color: activeTab === 'doctor' ? '#0891b2' : '#64748b',
              fontWeight: 600, cursor: 'pointer', fontSize: '14px'
            }}
          >
            👨‍⚕️ Find a Doctor
          </button>
          <button
            onClick={() => setActiveTab('store')}
            style={{
              flex: 1, padding: '12px', background: 'transparent', border: 'none',
              borderBottom: activeTab === 'store' ? '2px solid #0891b2' : '2px solid transparent',
              color: activeTab === 'store' ? '#0891b2' : '#64748b',
              fontWeight: 600, cursor: 'pointer', fontSize: '14px'
            }}
          >
            💊 Medicines & Blood
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'doctor' && (
            <>
              {/* Step 1: Input symptoms */}
              <div>
                <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  🩺 Describe your symptoms or health concern:
                </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. I have a severe headache, blurred vision, and feel dizzy..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                fontSize: '14px',
                background: '#f8fafc',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />

            <button
              onClick={handleRoute}
              disabled={loading || !symptoms.trim()}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                background: loading || !symptoms.trim() ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loading || !symptoms.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                  }} />
                  Analysing your diagnosis...
                </>
              ) : '🔍 Find Recommended Doctors'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '12px 16px', color: '#b91c1c', fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI Explanation */}
              <div style={{
                background: 'linear-gradient(135deg, #ecfeff, #e0f2fe)',
                border: '1px solid #a5f3fc',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#0e7490', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  💡 What this means
                </div>
                <p style={{ fontSize: '14px', color: '#0f172a', lineHeight: 1.6 }}>{result.explanation}</p>
                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0891b2', color: 'white', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}>
                  Recommended Specialty: {result.specialty}
                </div>
              </div>

              {/* Doctors List */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#334155' }}>
                  👨‍⚕️ Recommended {result.specialty} Specialists Near You
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginLeft: '8px' }}>
                    (Sorted by rating • Mock data for demo)
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.recommendedDoctors.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '14px' }}>No doctors found for this specialty in our directory.</p>
                  ) : result.recommendedDoctors.map((doc) => (
                    <div key={doc._id} style={{
                      background: '#fff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(8,145,178,0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '16px', flexShrink: 0
                        }}>
                          {doc.name.charAt(4) || 'D'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{doc.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.clinicName}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>📍 {doc.location?.address || 'Lucknow'}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px' }}>{renderStars(doc.rating)}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{doc.rating.toFixed(1)} / 5.0</div>
                        <div style={{ marginTop: '4px', fontWeight: 700, color: '#0891b2', fontSize: '13px' }}>
                          ₹{doc.consultationFee}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Browse all link */}
                <button
                  onClick={() => { onClose(); navigate('/doctors'); }}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'transparent', border: '1.5px dashed #0891b2',
                    borderRadius: '8px', color: '#0891b2', fontWeight: 600,
                    fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Browse All Doctors in Directory →
                </button>
            </div>
          )}

              {/* Disclaimer */}
              <p style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                ⚠️ Doctor data is seeded mock data for demonstration purposes. In production, this would be replaced by a real verified doctor registry. Always consult a real qualified medical professional.
              </p>
            </>
          )}

          {activeTab === 'store' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px' }}>🏥</div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Looking for Medicines or Blood?</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                  Find nearby pharmacies with required medicines in stock, or check blood bank inventory instantly.
                </p>
              </div>
              
              <button
                onClick={() => { onClose(); navigate('/stores'); }}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🔍 Search Stores & Blood Banks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
