import ChatWidget from '../components/ChatWidget';
import { useLocation } from 'react-router-dom';

export default function ChatPage() {
  const location = useLocation();
  const initialContext = location.state?.initialContext;

  return (
    <div className="page-shell" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <h1 className="page-title" style={{ marginBottom: '4px' }}>AI Health Assistant</h1>
        <p className="page-subtitle" style={{ marginBottom: '16px' }}>
          Describe your symptoms, ask about your reports, or find a doctor. All conversations are reviewed by your doctor for safety.
        </p>
      </div>
      <div className="panel-surface" style={{
        flex: 1, margin: '0 0 16px 0',
        background: 'rgba(1, 29, 28, 0.8)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minHeight: 0,
      }}>
        <ChatWidget initialContext={initialContext} />
      </div>
    </div>
  );
}
