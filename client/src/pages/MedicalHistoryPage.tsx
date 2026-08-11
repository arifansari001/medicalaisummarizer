import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { MedicalEvent } from '../types';

export default function MedicalHistoryPage() {
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      let url = '/medical-events?limit=100';
      if (selectedType) url += `&type=${selectedType}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      const res = await api.get<{ events: MedicalEvent[] }>(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedStatus]);

  return (
    <div className="history-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Medical History</h1>
          <p className="card-subtitle">Log past illnesses, surgeries, visits, and health events</p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/history/new')}>
          + Record Health Event
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select 
          value={selectedType} 
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="">All Event Types</option>
          <option value="illness">Illness</option>
          <option value="injury">Injury</option>
          <option value="surgery">Surgery</option>
          <option value="allergy">Allergy</option>
          <option value="hospitalization">Hospitalization</option>
          <option value="doctor_visit">Doctor Visit</option>
          <option value="vaccination">Vaccination</option>
          <option value="medical_test">Medical Test</option>
          <option value="medication">Medication</option>
          <option value="other">Other</option>
        </select>

        <select 
          value={selectedStatus} 
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="ongoing">Ongoing</option>
          <option value="recovered">Recovered</option>
          <option value="resolved">Resolved</option>
          <option value="chronic">Chronic</option>
        </select>

        {(selectedType || selectedStatus) && (
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => { setSelectedType(''); setSelectedStatus(''); }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="events-list">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : events.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Health Events Recorded</h3>
          <p>Record your past medical events, doctor visits, or allergies to maintain a clear history.</p>
          <button className="btn btn-primary" onClick={() => navigate('/history/new')}>
            Record First Event
          </button>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div
              key={event._id}
              className="event-card"
              onClick={() => navigate(`/history/${event._id}`)}
            >
              <div className="event-card-icon">
                {event.type === 'illness' ? '🤒' :
                 event.type === 'surgery' ? '🏥' :
                 event.type === 'vaccination' ? '💉' :
                 event.type === 'allergy' ? '⚠️' : '🩺'}
              </div>

              <div className="event-card-content">
                <div className="event-card-title">{event.title}</div>
                <div className="event-card-date">
                  {new Date(event.date).toLocaleDateString()} • <span className="text-capitalize">{event.type.replace('_', ' ')}</span>
                  {event.doctorName && ` • Dr. ${event.doctorName}`}
                </div>
                {event.description && <p className="event-card-desc">{event.description}</p>}

                {event.attachedReports && event.attachedReports.length > 0 && (
                  <div className="timeline-report-chip mt-2">
                    📄 {event.attachedReports.length} attached report(s)
                  </div>
                )}
              </div>

              <span className={`badge badge-${event.status === 'recovered' || event.status === 'resolved' ? 'success' : 'warning'}`}>
                {event.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
