import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ShareRecord, Report, Analysis, MedicalEvent } from '../types';

export default function DoctorSharedRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<{
    share: ShareRecord;
    patient: any;
    events: MedicalEvent[];
    reports: Report[];
    analyses: Analysis[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShare() {
      try {
        const res = await api.get<{
          share: ShareRecord;
          patient: any;
          events: MedicalEvent[];
          reports: Report[];
          analyses: Analysis[];
        }>(`/shares/doctor/${id}`);
        setShareData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load shared record');
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [id]);

  if (loading) {
    return <div className="skeleton skeleton-card" />;
  }

  if (error) {
    return (
      <div className="alert alert-error mt-4">
        <p>{error}</p>
        <button className="btn btn-secondary mt-2" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  // Removed hardcoded single analysis and report

  return (
    <div className="doctor-shared-record-page animate-fade-in" style={{ padding: '2rem' }}>
      <h1 className="page-title mb-4">Shared Record – Patient {shareData.patient?.name ?? 'Unknown'}</h1>
      {/* Events Row */}
      {shareData.events && shareData.events.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Shared Medical History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shareData.events.map(event => (
              <div key={event._id} className="card p-4">
                <h3 className="font-medium text-lg">{event.title}</h3>
                <p className="text-sm text-secondary">{new Date(event.date).toLocaleDateString()} - {event.type}</p>
                {event.description && <p className="mt-2 text-sm">{event.description}</p>}
                {event.symptoms && event.symptoms.length > 0 && (
                  <p className="mt-1 text-sm">Symptoms: {event.symptoms.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Rows */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Shared Reports</h2>
        {shareData.reports.map((report) => {
          const analysis = shareData.analyses.find(a => a.reportId === report._id);
          const fileName = report.filePath.split(/[\\/]/).pop();
          const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${fileName}`;
          
          return (
            <div key={report._id} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Summary Column */}
              <div className="summary-card glass" style={{ backdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h2 className="text-xl font-semibold mb-2">AI‑Generated Summary</h2>
                {analysis ? (
                  <p className="text-base leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{analysis.summary}</p>
                ) : (
                  <p>No summary available.</p>
                )}
              </div>
              {/* Original Report Column */}
              <div className="report-card glass" style={{ backdropFilter: 'blur(12px)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h2 className="text-xl font-semibold mb-2">{report.fileName}</h2>
                <div className="flex flex-col gap-4">
                  {/* PDF/Image preview */}
                  {report.fileType.includes('pdf') ? (
                    <iframe src={fileUrl} title={report.fileName} style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <img src={fileUrl} alt={report.fileName} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
                  )}
                  {/* Extracted text */}
                  <details>
                    <summary className="font-medium cursor-pointer">View Extracted Text ({report.extractedText?.length || 0} characters)</summary>
                    <pre className="whitespace-pre-wrap break-words mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      {report.extractedText}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
