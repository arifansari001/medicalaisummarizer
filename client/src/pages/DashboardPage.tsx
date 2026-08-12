import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { Report, MedicalEvent } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportsRes, eventsRes] = await Promise.all([
          api.get<{ reports: Report[] }>('/reports?limit=5'),
          api.get<{ events: MedicalEvent[] }>('/medical-events?limit=5'),
        ]);
        setReports(reportsRes.data.reports || []);
        setEvents(eventsRes.data.events || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const completedAnalysesCount = reports.filter(r => r.processingStatus === 'completed').length;

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'} 👋</h1>
          <p className="card-subtitle">Personal Health Record & AI Report Overview</p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/reports')}>
            + Upload Medical Report
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/history/new')}>
            + Add Health Event
          </button>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon reports">📄</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : reports.length}</h3>
            <p>Uploaded Reports</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events">📋</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : events.length}</h3>
            <p>Medical History Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon analyses">🤖</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : completedAnalysesCount}</h3>
            <p>AI Analyzed Summaries</p>
          </div>
        </div>
      </div>

      {/* Feature Navigation Actions */}
      <div className="feature-actions-grid">
        <button className="feature-action-btn triage-btn" onClick={() => navigate('/doctors')}>
          <div className="btn-icon">🤖</div>
          <div className="btn-text">
            <h3>AI Triage & Doctors</h3>
            <p>Check symptoms & find specialists</p>
          </div>
        </button>
        <button className="feature-action-btn store-btn" onClick={() => navigate('/stores')}>
          <div className="btn-icon">💊</div>
          <div className="btn-text">
            <h3>Medicines & Blood</h3>
            <p>Find nearby pharmacies & banks</p>
          </div>
        </button>
        <button className="feature-action-btn timeline-btn" onClick={() => navigate('/timeline')}>
          <div className="btn-icon">📈</div>
          <div className="btn-text">
            <h3>Health Timeline</h3>
            <p>View your AI health journey</p>
          </div>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
        {/* Recent Reports */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Reports</h2>
              <p className="card-subtitle">Latest medical documents</p>
            </div>
            <Link to="/reports" className="btn btn-ghost btn-sm">View All →</Link>
          </div>

          {isLoading ? (
            <div className="skeleton skeleton-card" />
          ) : reports.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">📄</div>
              <p>No reports uploaded yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/reports')}>
                Upload Your First Report
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map(report => (
                <div
                  key={report._id}
                  className="report-card"
                  onClick={() => navigate(`/reports/${report._id}`)}
                >
                  <div className="report-card-header">
                    <div>
                      <div className="report-card-title">{report.fileName}</div>
                      <div className="text-xs text-secondary">
                        {report.reportType || 'Medical Report'} • {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge badge-${report.processingStatus}`}>
                      {report.processingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Medical History</h2>
              <p className="card-subtitle">Recent health events & illnesses</p>
            </div>
            <Link to="/history" className="btn btn-ghost btn-sm">View History →</Link>
          </div>

          {isLoading ? (
            <div className="skeleton skeleton-card" />
          ) : events.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">📋</div>
              <p>No health events recorded yet.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/history/new')}>
                Log Past Illness or Visit
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
                     event.type === 'vaccination' ? '💉' : '🩺'}
                  </div>
                  <div className="event-card-content">
                    <div className="event-card-title">{event.title}</div>
                    <div className="event-card-date">
                      {new Date(event.date).toLocaleDateString()} • <span className="text-capitalize">{event.type}</span>
                    </div>
                    {event.description && <p className="event-card-desc">{event.description}</p>}
                  </div>
                  <span className={`badge badge-${event.status === 'recovered' || event.status === 'resolved' ? 'success' : 'warning'}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
