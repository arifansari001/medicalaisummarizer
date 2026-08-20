import DietaryAdviceCard from "../components/DietaryAdviceCard";
// adjust the relative path (../components/...) to match where you actually saved the file
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import type { Report, Analysis } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'finding' | 'testResult';
    index: number;
    description: string;
    originalValue?: string;
    referenceRange?: string;
    confidenceScore?: number;
    boundingBox?: any;
  } | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await api.get<{ report: Report; analysis: Analysis | null }>(`/reports/${id}`);
      setReport(res.data.report);
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => {
    if (!report || report.processingStatus === 'completed' || report.processingStatus === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ report: Report; analysis: Analysis | null }>(`/reports/${id}`);
        setReport(res.data.report);
        setAnalysis(res.data.analysis);
        if (res.data.report.processingStatus === 'completed' || res.data.report.processingStatus === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [id, report?.processingStatus]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.post(`/reports/${id}/analyze`);
      fetchReport();
    } catch (err) {
      alert('Failed to trigger analysis retry.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/reports/${id}`);
      navigate('/reports');
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  const handleVerifyOrCorrect = async () => {
    if (!selectedItem) return;
    setIsSubmittingCorrection(true);
    try {
      const res = await api.post(`/reports/${id}/analysis/correct`, {
        type: selectedItem.type,
        index: selectedItem.index,
        correctedValue: correctionValue,
      });
      setAnalysis(res.data.analysis);
      setSelectedItem(null);
      setCorrectionValue('');
      alert('Clinician verification saved successfully.');
    } catch (err) {
      alert('Failed to save clinician verification.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="empty-state">
        <h3>Report Not Found</h3>
        <p>The requested report does not exist or you do not have permission to view it.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
          Back to Reports
        </button>
      </div>
    );
  }

  const apiBaseUrl = ((import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL) || 'http://localhost:5000';
  const fileUrl = report ? `${apiBaseUrl}/uploads/${report.userId}/${report.filePath.split(/[\\/]/).pop()}` : '';

  const scrollToDocument = () => {
    document.getElementById('document-viewer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="report-detail-page animate-fade-in pb-12">
      <div className="detail-header">
        <button className="detail-back" onClick={() => navigate('/reports')} title="Back">
          ←
        </button>
        <div>
          <h1 className="detail-title">{report.fileName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className={`badge badge-${report.processingStatus}`}>
              {report.processingStatus}
            </span>
            <span className="text-xs text-secondary">
              Uploaded on {new Date(report.createdAt).toLocaleDateString()}
            </span>
            {report.metadata?.date && (
              <span className="text-xs text-secondary">| Report Date: {new Date(report.metadata.date).toLocaleDateString()}</span>
            )}
            {report.metadata?.hospitalName && (
              <span className="text-xs text-secondary">| Hospital: {report.metadata.hospitalName}</span>
            )}
            {report.metadata?.doctorName && (
              <span className="text-xs text-secondary">| Doctor: {report.metadata.doctorName}</span>
            )}
          </div>
        </div>

        <div className="detail-actions">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete Report
          </button>
        </div>
      </div>

      <MedicalDisclaimer />

      {(report.processingStatus === 'uploaded' || report.processingStatus === 'extracting' || report.processingStatus === 'analyzing') && (
        <div className="card text-center my-8 p-8">
          <div className="loading-spinner mx-auto mb-4" />
          <h3>Understanding Your Medical Report...</h3>
          <p className="text-sm text-secondary mt-2">
            Text extraction and AI structured analysis are running in the background.
          </p>

          <div className="processing-steps">
            <div className={`processing-step ${report.processingStatus !== 'uploaded' ? 'completed' : 'active'}`}>
              <div className="processing-step-icon">1</div>
              <span className="processing-step-text">Document Saved</span>
            </div>
            <div className={`processing-step ${report.processingStatus === 'analyzing' ? 'completed' : report.processingStatus === 'extracting' ? 'active' : 'pending'}`}>
              <div className="processing-step-icon">2</div>
              <span className="processing-step-text">OCR & PDF Text Parser</span>
            </div>
            <div className={`processing-step ${report.processingStatus === 'analyzing' ? 'active' : 'pending'}`}>
              <div className="processing-step-icon">3</div>
              <span className="processing-step-text">AI Structured Understanding</span>
            </div>
          </div>
        </div>
      )}

      {report.processingStatus === 'failed' && (
        <div className="alert alert-error my-6">
          <strong>Analysis Failed</strong>
          <p>{report.processingError || 'Unable to process report text.'}</p>
          <button className="btn btn-secondary btn-sm mt-3" onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? 'Retrying...' : 'Retry Analysis'}
          </button>
        </div>
      )}      {report.processingStatus === 'completed' && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          
          {/* Left Column: AI Analysis */}
          <div className="analysis-container flex flex-col gap-6">
            
            {/* EVIDENCE AUDIT TRAIL POP PANEL */}
            {selectedItem && (
              <div className="card border-2 border-cyan-500 bg-cyan-50/20 p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-cyan-800 flex items-center gap-1">
                    🔍 Evidence-Linked Audit Trail
                  </h3>
                  <button className="text-xs text-secondary hover:text-primary font-semibold" onClick={() => setSelectedItem(null)}>✕ Close</button>
                </div>
                <div className="text-xs space-y-2 text-primary">
                  <p><strong>AI Statement:</strong> “{selectedItem.description}”</p>
                  {selectedItem.originalValue && <p><strong>Original Value:</strong> {selectedItem.originalValue}</p>}
                  {selectedItem.referenceRange && <p><strong>Reference Range:</strong> {selectedItem.referenceRange}</p>}
                  <p><strong>Confidence Score:</strong> {selectedItem.confidenceScore}% AI Confidence</p>
                  {selectedItem.boundingBox && (
                    <p className="bg-white p-2 rounded border font-mono">
                      <strong>Bounding Box:</strong> Page {selectedItem.boundingBox.page} [x: {selectedItem.boundingBox.x}, y: {selectedItem.boundingBox.y}, w: {selectedItem.boundingBox.width}, h: {selectedItem.boundingBox.height}]
                    </p>
                  )}
                  <p className="text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                    ⚠️ <strong>Disclaimer:</strong> This is an explanation, not a diagnosis.
                  </p>
                </div>

                {user?.role === 'doctor' && (
                  <div className="mt-4 pt-3 border-t border-cyan-200">
                    <label className="block text-xs font-bold text-gray-700 mb-1">🧑‍⚕️ Clinician Correction</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 border rounded p-1.5 text-xs"
                        value={correctionValue}
                        onChange={(e) => setCorrectionValue(e.target.value)}
                        placeholder="Enter the correct medical value or description..."
                      />
                      <button 
                        className="btn btn-primary btn-sm py-1.5"
                        onClick={handleVerifyOrCorrect}
                        disabled={isSubmittingCorrection}
                      >
                        {isSubmittingCorrection ? 'Saving...' : 'Verify & Correct'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <h2 className="analysis-section-title">
                💡 Plain-Language Summary
              </h2>
              <p className="text-base text-primary leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {analysis.diagnoses && analysis.diagnoses.length > 0 && (
              <div className="card border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="analysis-section-title text-blue-600" style={{ margin: 0 }}>
                    🩺 Diagnosed Health Issue
                  </h2>
                  <button
                    onClick={() => navigate('/chat', { state: { initialContext: `I was just diagnosed with ${analysis.diagnoses.join(', ')}. Can you help me find a doctor or understand this better?` } })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                      color: 'white', border: 'none', borderRadius: '20px',
                      padding: '7px 16px', fontWeight: 600, fontSize: '13px',
                      cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                    title="AI-powered doctor recommendation based on your diagnosis"
                  >
                    🤖 Find a Doctor
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {analysis.diagnoses.map((diagnosis, idx) => (
                    <a 
                      key={idx} 
                      href="#document-viewer" 
                      onClick={(e) => { e.preventDefault(); scrollToDocument(); }}
                      className="text-lg font-medium text-blue-600 hover:underline cursor-pointer flex items-center gap-2"
                    >
                      {diagnosis}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">View in Original Document ↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CARE PATHWAY NAVIGATION (D) */}
            {analysis.carePathwaySuggestion && (
              <div className="card border-l-4 border-purple-500 bg-purple-50/10">
                <h2 className="analysis-section-title text-purple-600">
                  🗺️ Recommended Care Pathway
                </h2>
                <p className="text-xs text-secondary mb-3">
                  The following is a care-navigation suggestion with uncertainty, not a definitive clinical conclusion.
                </p>
                <div className="flex flex-col gap-3">
                  {analysis.carePathwaySuggestion.recommendedProviderTypes && analysis.carePathwaySuggestion.recommendedProviderTypes.length > 0 && (
                    <div>
                      <span className="text-xs font-bold uppercase text-purple-600 block">Recommended Specialists to Discuss With:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.carePathwaySuggestion.recommendedProviderTypes.map((provider, index) => (
                          <span key={index} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.carePathwaySuggestion.nextSteps && analysis.carePathwaySuggestion.nextSteps.length > 0 && (
                    <div>
                      <span className="text-xs font-bold uppercase text-purple-600 block">Suggested Preparation & Next Steps:</span>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-primary">
                        {analysis.carePathwaySuggestion.nextSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysis.preventionTips && analysis.preventionTips.length > 0 && (
              <div className="card border-l-4 border-green-500">
                <h2 className="analysis-section-title text-green-600">
                  🛡️ Prevention Tips & Advice
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.preventionTips.map((tip, idx) => (
                    <li key={idx} className="text-sm">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.dietaryAdvice && (
             <div className="card">
                <h2 className="analysis-section-title">
                    🍎 Dietary Recommendations
                </h2>
                <DietaryAdviceCard advice={analysis.dietaryAdvice} />
              </div>
            )}

            {analysis.findings && analysis.findings.length > 0 && (
              <div className="card">
                <h2 className="analysis-section-title">
                  ⚠️ Key Findings & Observations
                </h2>
                <div className="findings-list">
                  {analysis.findings.map((finding: any, idx: number) => (
                    <a 
                      key={idx} 
                      href="#document-viewer"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        scrollToDocument(); 
                        setSelectedItem({
                          type: 'finding',
                          index: idx,
                          description: finding.description || finding,
                          originalValue: finding.description || finding,
                          confidenceScore: finding.boundingBox?.confidenceScore || 92,
                          boundingBox: finding.boundingBox
                        });
                        setCorrectionValue(finding.correctedValue || finding.description || finding);
                      }}
                      className="finding-item block hover:bg-blue-50 cursor-pointer transition-colors p-3 rounded-md border border-transparent hover:border-blue-100"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-800">
                          {finding.verifiedByDoctor ? (
                            <>
                              <span className="line-through text-gray-400 mr-2">{finding.description}</span>
                              <span className="text-green-700 font-medium">{finding.correctedValue}</span>
                            </>
                          ) : (
                            typeof finding === 'string' ? finding : finding.description
                          )}
                          {finding.verifiedByDoctor && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold ml-2">
                              ✓ Clinician Verified
                            </span>
                          )}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ opacity: 0.8 }}>
                          Audit Evidence ↗
                        </span>
                      </div>
                      {typeof finding === 'object' && finding.sourcePage != null && (
                        <span className="text-xs text-secondary mt-1 block">Page {finding.sourcePage}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {analysis.testResults && analysis.testResults.length > 0 && (
              <div className="card">
                <h2 className="analysis-section-title">
                  🧪 Test Values & Reference Ranges
                </h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Extracted Value</th>
                        <th>Unit</th>
                        <th>Reference Range (From Report)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.testResults.map((test, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() => {
                            setSelectedItem({
                              type: 'testResult',
                              index: idx,
                              description: test.name,
                              originalValue: test.value,
                              referenceRange: test.referenceRange,
                              confidenceScore: test.boundingBox?.confidenceScore || 96,
                              boundingBox: test.boundingBox
                            });
                            setCorrectionValue(test.correctedValue || test.value);
                          }}
                        >
                          <td className="font-semibold">{test.name}</td>
                          <td>
                            {test.verifiedByDoctor ? (
                              <>
                                <span className="line-through text-gray-400 mr-2">{test.value}</span>
                                <span className="text-green-700 font-medium">{test.correctedValue}</span>
                                <span className="block text-[10px] text-green-600 font-semibold">✓ Clinician Verified</span>
                              </>
                            ) : (
                              test.value
                            )}
                          </td>
                          <td>{test.unit || '-'}</td>
                          <td>{test.referenceRange || 'Not provided'}</td>
                          <td>
                            <span className={`badge badge-${test.status}`}>
                              {test.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {analysis.medicalTerms && analysis.medicalTerms.length > 0 && (
              <div className="card">
                <h2 className="analysis-section-title">
                  📖 Medical Terminology Simplified
                </h2>
                <div className="terms-grid">
                  {analysis.medicalTerms.map((termItem, idx) => (
                    <div key={idx} className="term-card">
                      <div className="term-name">{termItem.term}</div>
                      <div className="term-explanation">{termItem.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.doctorQuestions && analysis.doctorQuestions.length > 0 && (
              <div className="card">
                <h2 className="analysis-section-title">
                  ❓ Recommended Questions for Your Doctor
                </h2>
                <div className="questions-list">
                  {analysis.doctorQuestions.map((question, idx) => (
                    <div key={idx} className="question-item">
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Original Document */}
          <div className="original-document-container flex flex-col gap-4 sticky top-6 self-start h-screen pb-12" id="document-viewer">
            <div className="card flex-1 flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
              <div className="border-b pb-2 mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Original Document</h2>
              </div>
              
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                {report.fileType.includes('pdf') ? (
                  <iframe 
                    src={fileUrl} 
                    title={report.fileName} 
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
                    <img 
                      src={fileUrl} 
                      alt={report.fileName} 
                      className="max-w-full h-auto object-contain shadow-sm rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {report.extractedText && (
              <details className="card">
                <summary className="font-semibold cursor-pointer text-sm text-secondary">
                  View Raw Extracted Text ({report.extractedText.length} characters)
                </summary>
                <pre className="mt-4 p-4 bg-tertiary rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64">
                  {report.extractedText}
                </pre>
              </details>
            )}
          </div>
          
        </div>
      )}

      {/* Removed old Chatbot Modal */}
    </div>
  );
}