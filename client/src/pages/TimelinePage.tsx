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

interface LabTrendPoint {
  value: number;
  date: string;
  unit: string;
  referenceRange: string;
}

function SVGTrendChart({ testName, data }: { testName: string; data: LabTrendPoint[] }) {
  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1;
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 200;
  const padding = 30;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minVal) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm my-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-gray-800">📈 {testName} Trend Over Time</h4>
        <span className="text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-mono">
          Unit: {data[0].unit || 'N/A'} | Ref: {data[0].referenceRange || 'N/A'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px] h-auto">
          {/* Y Axis Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeDasharray="4" />
          
          {/* Trend Line */}
          <path d={linePath} fill="none" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#0891b2" strokeWidth="2" />
              <text x={p.x} y={p.y - 10} fontSize="10" textAnchor="middle" fill="#0f172a" fontWeight="bold">
                {p.value}
              </text>
              <text x={p.x} y={height - 10} fontSize="8" textAnchor="middle" fill="#64748b">
                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [labTrends, setLabTrends] = useState<Record<string, LabTrendPoint[]>>({});
  const [selectedTestTrend, setSelectedTestTrend] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTimelineData() {
      try {
        const [timelineRes, reportsRes, appointmentsRes] = await Promise.all([
          api.get<{ events: MedicalEvent[], labTrends: Record<string, LabTrendPoint[]> }>('/medical-events/timeline'),
          api.get<{ reports: Report[] }>('/reports?limit=100'),
          api.get<{ appointments: any[] }>('/appointments/me').catch(() => ({ data: { appointments: [] } })),
        ]);

        const eventsList = timelineRes.data.events || [];
        const trends = timelineRes.data.labTrends || {};
        setLabTrends(trends);
        
        // Auto-select first trend that has enough data points
        const trendKeys = Object.keys(trends).filter(k => trends[k].length >= 2);
        if (trendKeys.length > 0) {
          setSelectedTestTrend(trendKeys[0]);
        }

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

      {/* Test Trend Selector Panel */}
      {!isLoading && Object.keys(labTrends).length > 0 && (
        <div className="card mb-6 bg-slate-50/50 p-4 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">📊 Longitudinal Laboratory Test Trends</h3>
              <p className="text-xs text-secondary mt-0.5">Track numerical laboratory results over compatible ranges and specimen types.</p>
            </div>
            <div>
              <select
                className="select text-xs p-2 border rounded bg-white shadow-sm"
                value={selectedTestTrend}
                onChange={e => setSelectedTestTrend(e.target.value)}
              >
                <option value="">-- Select Lab Value to Plot --</option>
                {Object.keys(labTrends).map(test => (
                  <option key={test} value={test}>{test} ({labTrends[test].length} entries)</option>
                ))}
              </select>
            </div>
          </div>
          {selectedTestTrend && labTrends[selectedTestTrend] && (
            <SVGTrendChart testName={selectedTestTrend} data={labTrends[selectedTestTrend]} />
          )}
        </div>
      )}

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
