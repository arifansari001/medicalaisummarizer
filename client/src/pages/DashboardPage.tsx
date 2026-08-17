import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { Report, MedicalEvent } from '../types';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Tile {
  id: string;
  label: string;
  desc: string;
  icon: string;
  path: string;
  className: string;
}

function SortableTile({ tile, navigate }: { tile: Tile; navigate: ReturnType<typeof useNavigate> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`feature-action-btn ${tile.className} hover-lift`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        style={{ cursor: 'grab', paddingRight: '12px', fontSize: '18px', opacity: 0.8, display: 'flex', alignItems: 'center', userSelect: 'none' }}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>
      <div 
        onClick={() => navigate(tile.path)} 
        style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, cursor: 'pointer' }}
      >
        <div className="btn-icon" style={{ fontSize: '40px', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', background: 'rgba(0, 130, 124, 0.15)', animation: 'floatIcon 3s ease-in-out infinite' }}>{tile.icon}</div>
        <div className="btn-text">
          <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#edfffe', fontWeight: '500' }}>{tile.label}</h3>
          <p style={{ fontSize: '16px', color: '#bbc7c6' }}>{tile.desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load ordered tiles from localStorage or use default order
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const saved = localStorage.getItem('medsummary_dashboard_tiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse tiles order:', e);
      }
    }
    return [
      { id: 'triage', label: 'AI Triage & Doctors', desc: 'Check symptoms & find specialists', icon: '🤖', path: '/doctors', className: 'triage-btn' },
      { id: 'stores', label: 'Medicines & Blood', desc: 'Find nearby pharmacies & banks', icon: '💊', path: '/stores', className: 'store-btn' },
      { id: 'timeline', label: 'Health Timeline', desc: 'View your AI health journey', icon: '📈', path: '/timeline', className: 'timeline-btn' },
    ];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('medsummary_dashboard_tiles', JSON.stringify(reordered));
        return reordered;
      });
    }
  }

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
          <h1>Welcome back, {user?.name || 'User'}</h1>
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
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : reports.length}</h3>
            <p>Uploaded Reports</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : events.length}</h3>
            <p>Medical History Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-content">
            <h3>{isLoading ? '...' : completedAnalysesCount}</h3>
            <p>AI Analyzed Summaries</p>
          </div>
        </div>
      </div>

      {/* Feature Navigation Actions (Draggable and Reorderable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tiles.map(t => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="feature-actions-grid">
            {tiles.map((tile) => (
              <SortableTile key={tile.id} tile={tile} navigate={navigate} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Content Grid */}
      <div className="dashboard-columns-grid">
        {/* Recent Reports */}
        <div className="card card-heartbeat-bg">
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
        <div className="card card-heartbeat-bg">
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
