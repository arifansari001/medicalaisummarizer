import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ShareRecord } from '../types';

export default function DoctorDashboardPage() {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) {
    return <div className="skeleton skeleton-card" />;
  }

  return (
    <div className="doctor-dashboard animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Upcoming Appointments */}
      <div>
        <h1 className="page-title" style={{ marginBottom: '16px' }}>Upcoming Appointments</h1>
        {appointments.length === 0 ? (
          <p className="empty-state">No upcoming appointments booked.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.map((apt) => (
              <div key={apt._id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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

      {/* Shared Records */}
      <div>
        <h1 className="page-title" style={{ marginBottom: '16px' }}>Shared Records from Patients</h1>
        {shares.length === 0 ? (
          <p className="empty-state">No shares have been granted to you yet.</p>
      ) : (
        <div className="share-grid">
          {shares.map((share) => (
            <div key={share._id} className="share-card" onClick={() => handleView(share._id)}>
              <h3 className="share-patient-name">Patient: {(share.patientId as any)?.name?? 'Unknown'}</h3>
              <p className="share-doctor-email">Shared by: {share.doctorEmail}</p>
              <p className="share-expires">Expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
              {share.revokedAt && <p className="share-revoked">Revoked</p>}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
