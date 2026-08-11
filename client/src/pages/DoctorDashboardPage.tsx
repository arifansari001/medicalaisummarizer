import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ShareRecord } from '../types';

export default function DoctorDashboardPage() {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchShares() {
      try {
        const res = await api.get<{ shares: ShareRecord[] }>('/shares/doctor');
        setShares(res.data.shares);
      } catch (err) {
        console.error('Failed to load doctor shares', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShares();
  }, []);

  const handleView = (shareId: string) => {
    navigate(`/doctor/share/${shareId}`);
  };

  if (loading) {
    return <div className="skeleton skeleton-card" />;
  }

  return (
    <div className="doctor-dashboard animate-fade-in">
      <h1 className="page-title">Shared Records from Patients</h1>
      {shares.length === 0 ? (
        <p className="empty-state">No shares have been granted to you yet.</p>
      ) : (
        <div className="share-grid">
          {shares.map((share) => (
            <div key={share._id} className="share-card" onClick={() => handleView(share._id)}>
              <h3 className="share-patient-name">Patient: {share.patientId?.name ?? 'Unknown'}</h3>
              <p className="share-doctor-email">Shared by: {share.doctorEmail}</p>
              <p className="share-expires">Expires: {new Date(share.expiresAt).toLocaleDateString()}</p>
              {share.revokedAt && <p className="share-revoked">Revoked</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
