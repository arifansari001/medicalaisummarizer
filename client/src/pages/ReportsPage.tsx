import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import FileUpload from '../components/FileUpload';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import ShareModal from '../components/ShareModal';
import type { Report } from '../types';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const res = await api.get<{ reports: Report[] }>('/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<{ report: Report }>('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setShowUploadModal(false);
      fetchReports();
      navigate(`/reports/${res.data.report._id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="reports-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Medical Reports</h1>
          <p className="card-subtitle">Upload, view, and analyze your medical documents</p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
            Share with Doctor
          </button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            + Upload New Report
          </button>
        </div>
      </div>

      <MedicalDisclaimer />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Medical Report</h2>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                ✕
              </button>
            </div>

            <FileUpload 
              onFileSelect={handleFileUpload}
              isLoading={isUploading}
              progress={uploadProgress}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal onClose={() => setShowShareModal(false)} />
      )}

      {/* Reports Grid */}
      {isLoading ? (
        <div className="reports-grid">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No Reports Uploaded</h3>
          <p>Upload a lab report, blood test, X-ray summary, or prescription to get AI-assisted plain-language explanations.</p>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            Upload Report Now
          </button>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map(report => (
            <div
              key={report._id}
              className="report-card"
              onClick={() => navigate(`/reports/${report._id}`)}
            >
              <div className="report-card-header">
                <span className="report-card-icon">
                  {report.fileType.includes('pdf') ? '📄' : '🖼️'}
                </span>
                <span className={`badge badge-${report.processingStatus}`}>
                  {report.processingStatus}
                </span>
              </div>

              <div className="report-card-title">{report.fileName}</div>
              
              <div className="text-xs text-secondary mb-2">
                {report.reportType || 'Uncategorized Report'}
              </div>

              <div className="report-card-meta">
                <span>{(report.fileSize / 1024).toFixed(1)} KB</span>
                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
