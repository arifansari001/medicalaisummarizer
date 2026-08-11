import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { MedicalEvent, Report } from '../types';

interface TimelineItem {
  id: string;
  type: 'event' | 'report';
  date: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  raw: MedicalEvent | Report;
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTimelineData() {
      try {
        const [eventsRes, reportsRes] = await Promise.all([
          api.get<{ events: MedicalEvent[] }>('/medical-events?limit=100'),
          api.get<{ reports: Report[] }>('/reports?limit=100'),
        ]);

        const eventsList = eventsRes.data.events || [];
        const reportsList = reportsRes.data.reports || [];

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

        const merged = [...timelineEvents, ...timelineReports].sort(
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
                    onClick={() =>
                      item.type === 'event'
                        ? navigate(`/history/${item.id}`)
                        : navigate(`/reports/${item.id}`)
                    }
                  >
                    <div className="timeline-item-header">
                      <span className="timeline-item-icon">
                        {item.type === 'report' ? '📄' : '📋'}
                      </span>
                      <span className="timeline-item-title">{item.title}</span>

                      <span className={`badge badge-${item.type === 'event' ? 'info' : item.status}`}>
                        {item.category.replace('_', ' ')}
                      </span>

                      <span className="timeline-item-date">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {item.subtitle && (
                      <p className="timeline-item-body">{item.subtitle}</p>
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
