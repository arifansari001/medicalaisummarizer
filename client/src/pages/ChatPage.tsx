import ChatWidget from '../components/ChatWidget';
import { useLocation } from 'react-router-dom';

export default function ChatPage() {
  const location = useLocation();
  const initialContext = location.state?.initialContext;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>AI Health Assistant</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
          Describe your symptoms, ask about your reports, or find a doctor. All conversations are reviewed by your doctor for safety.
        </p>
      </div>
      <div style={{
        flex: 1, margin: '0 0 16px 0',
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minHeight: 0,
      }}>
        <ChatWidget initialContext={initialContext} />
      </div>
    </div>
  );
}
