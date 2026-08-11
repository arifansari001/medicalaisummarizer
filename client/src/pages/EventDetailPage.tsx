import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { MedicalEvent, Report } from '../types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<MedicalEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await api.get<{ event: MedicalEvent }>(`/medical-events/${id}`);
        setEvent(res.data.event);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this medical event?')) return;
    try {
      await api.delete(`/medical-events/${id}`);
      navigate('/history');
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  if (isLoading) {
    return <div className="skeleton skeleton-card" />;
  }

  if (!event) {
    return (
      <div className="empty-state">
        <h3>Event Not Found</h3>
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>Back</button>
      </div>
    );
  }

  const reports = (event.attachedReports || []) as Report[];

  return (
    <div className="event-detail-page animate-fade-in">
      <div className="detail-header">
        <button className="detail-back" onClick={() => navigate('/history')}>←</button>
        <div>
          <h1 className="detail-title">{event.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="badge badge-info">{event.type}</span>
            <span className={`badge badge-${event.status === 'recovered' || event.status === 'resolved' ? 'success' : 'warning'}`}>
              {event.status}
            </span>
            <span className="text-xs text-secondary">
              Date: {new Date(event.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete Event
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="detail-grid">
          {event.doctorName && (
            <div className="detail-field">
              <div className="detail-field-label">Attending Doctor</div>
              <div className="detail-field-value">Dr. {event.doctorName}</div>
            </div>
          )}

          {event.hospitalName && (
            <div className="detail-field">
              <div className="detail-field-label">Hospital / Clinic</div>
              <div className="detail-field-value">{event.hospitalName}</div>
            </div>
          )}
        </div>

        {event.symptoms && event.symptoms.length > 0 && (
          <div className="detail-section">
            <div className="detail-section-title">Symptoms</div>
            <div className="flex flex-wrap gap-2">
              {event.symptoms.map((sym, idx) => (
                <span key={idx} className="tag">{sym}</span>
              ))}
            </div>
          </div>
        )}

        {event.description && (
          <div className="detail-section">
            <div className="detail-section-title">Description</div>
            <p className="text-sm text-primary">{event.description}</p>
          </div>
        )}

        {event.treatment && (
          <div className="detail-section">
            <div className="detail-section-title">Treatment & Prescriptions</div>
            <p className="text-sm text-primary">{event.treatment}</p>
          </div>
        )}

        {event.notes && (
          <div className="detail-section">
            <div className="detail-section-title">Personal Notes</div>
            <p className="text-sm text-secondary">{event.notes}</p>
          </div>
        )}
      </div>

      {/* Attached Reports */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Attached Medical Reports ({reports.length})</h2>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/reports')}
          >
            + Upload Report
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-secondary">No reports attached to this medical event yet.</p>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div
                key={report._id}
                className="report-card"
                onClick={() => navigate(`/reports/${report._id}`)}
              >
                <div className="report-card-header">
                  <span>📄</span>
                  <span className={`badge badge-${report.processingStatus}`}>
                    {report.processingStatus}
                  </span>
                </div>
                <div className="report-card-title">{report.fileName}</div>
                <div className="text-xs text-secondary mt-2">
                  {report.reportType || 'Medical Report'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
