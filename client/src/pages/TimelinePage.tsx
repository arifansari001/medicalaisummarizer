import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { MedicalEvent, Report } from '../types';

interface TimelineItem {
  id: string;
  type: 'event' | 'report' | 'appointment';
  date: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  raw: any;
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTimelineData() {
      try {
        const [eventsRes, reportsRes, appointmentsRes] = await Promise.all([
          api.get<{ events: MedicalEvent[] }>('/medical-events?limit=100'),
          api.get<{ reports: Report[] }>('/reports?limit=100'),
          api.get<{ appointments: any[] }>('/appointments/me').catch(() => ({ data: { appointments: [] } })),
        ]);

        const eventsList = eventsRes.data.events || [];
        const reportsList = reportsRes.data.reports || [];
        const appointmentsList = appointmentsRes.data.appointments || [];

        const timelineEvents: TimelineItem[] = eventsList.map(e => ({
          id: e._id,
          type: 'event',
          date: e.date,
          title: e.title,
          subtitle: e.description || e.treatment || '',
          category: e.type,
          status: e.status,
          raw: e,
        }));

        const timelineReports: TimelineItem[] = reportsList.map(r => ({
          id: r._id,
          type: 'report',
          date: r.createdAt,
          title: r.fileName,
          subtitle: r.reportType || 'Medical Report Upload',
          category: 'report',
          status: r.processingStatus,
          raw: r,
        }));

        const timelineAppointments: TimelineItem[] = appointmentsList.map(a => ({
          id: a._id,
          type: 'appointment',
          date: a.date,
          title: `Appointment with ${a.doctor?.name || 'Doctor'}`,
          subtitle: `${a.timeSlot} • ${a.reason || 'Routine Checkup'}`,
          category: 'appointment',
          status: a.status,
          raw: a,
        }));

        const merged = [...timelineEvents, ...timelineReports, ...timelineAppointments].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setItems(merged);
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimelineData();
  }, []);

  // Group items by year
  const groupedByYear = items.reduce<Record<string, TimelineItem[]>>((acc, item) => {
    const year = new Date(item.date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  const generateICS = (e: React.MouseEvent, appointment: any) => {
    e.stopPropagation();
    const startDate = new Date(appointment.date);
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedSummary AI//EN
BEGIN:VEVENT
UID:${appointment._id}@medsummary.ai
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Appointment with ${appointment.doctor?.name || 'Doctor'}
DESCRIPTION:${appointment.reason || 'Checkup'}\\nClinic: ${appointment.doctor?.clinicName || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment_${appointment._id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="timeline-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Personal Health Timeline</h1>
          <p className="card-subtitle">Chronological record of your health events and uploaded medical reports</p>
        </div>
      </div>

      <MedicalDisclaimer />

      {isLoading ? (
        <div className="timeline">
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : items.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>Your Timeline is Empty</h3>
          <p>Start by uploading a report or logging a past medical event to see your personal health journey chronologically.</p>
          <div className="flex gap-4 justify-center">
            <button className="btn btn-primary" onClick={() => navigate('/reports')}>
              Upload Report
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/history/new')}>
              Add Health Event
            </button>
          </div>
        </div>
      ) : (
        <div className="timeline">
          {years.map(year => (
            <div key={year} className="timeline-year">
              <div className="timeline-year-label">{year}</div>

              {groupedByYear[year].map(item => (
                <div key={item.id} className="timeline-item">
                  <div
                    className="card"
                    onClick={() => {
                      if (item.type === 'event') navigate(`/history/${item.id}`);
                      else if (item.type === 'report') navigate(`/reports/${item.id}`);
                      // no default route for appointments yet
                    }}
                  >
                    <div className="timeline-item-header">
                      <span className="timeline-item-icon">
                        {item.type === 'report' ? '📄' : item.type === 'appointment' ? '🗓️' : '📋'}
                      </span>
                      <span className="timeline-item-title">{item.title}</span>

                      <span className={`badge badge-${item.type === 'event' ? 'info' : item.type === 'appointment' ? 'warning' : item.status}`}>
                        {item.category.replace('_', ' ')}
                      </span>

                      <span className="timeline-item-date">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {item.subtitle && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <p className="timeline-item-body" style={{ margin: 0 }}>{item.subtitle}</p>
                        {item.type === 'appointment' && (
                          <button
                            onClick={(e) => generateICS(e, item.raw)}
                            style={{
                              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
                              padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: '#0891b2',
                              cursor: 'pointer'
                            }}
                          >
                            📅 Add to Calendar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
