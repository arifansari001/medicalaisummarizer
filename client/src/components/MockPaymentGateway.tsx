import { useState, useEffect } from 'react';

interface MockPaymentGatewayProps {
  amount: number;
  orderId: string;
  doctorName: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export default function MockPaymentGateway({ amount, orderId, doctorName, onSuccess, onCancel }: MockPaymentGatewayProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handlePay = () => {
    setLoading(true);
    // Simulate network delay for payment processing
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => {
        // Return a mock Razorpay-like payment ID
        onSuccess('pay_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
      }, 1500);
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '400px',
        overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transform: success ? 'scale(1.02)' : 'scale(1)', transition: 'transform 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ background: '#1e293b', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>MedSummary Pay</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.8 }}>Consultation: Dr. {doctorName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>Test Mode</span>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>₹{amount}</div>
          </div>
        </div>

        {/* Body */}
        {success ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', height: '60px', background: '#10b981', color: 'white', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', margin: '0 auto 16px', animation: 'bounce 0.5s ease'
            }}>✓</div>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Payment Successful</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Redirecting to confirmation...</p>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>⚠️ Test Payment Environment</span>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0' }}>No real money will be deducted. Click below to simulate a successful transaction.</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Card Number (Mock)</label>
              <input disabled value="4111 1111 1111 1111" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#94a3b8' }} />
            </div>

            <button
              onClick={handlePay}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', 
                fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
            >
              {loading ? (
                <span style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : `Pay ₹${amount}`}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: 'none', marginTop: '8px', fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
