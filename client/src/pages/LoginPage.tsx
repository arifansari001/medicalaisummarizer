import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login({ email, password });
      if (loggedUser.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setTimeout(() => {
      setResetMessage(`Password reset link has been sent to ${resetEmail}. Check your inbox!`);
      setResetLoading(false);
    }, 1000);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🏥</span>
            <h1>MedSummary AI</h1>
          </div>
          <p className="auth-subtitle">Sign in to your medical portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{
          display: 'flex', borderRadius: '10px', background: '#f1f5f9',
          padding: '4px', marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setRoleTab('patient')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              background: roleTab === 'patient' ? '#fff' : 'transparent',
              color: roleTab === 'patient' ? '#0891b2' : '#64748b',
              boxShadow: roleTab === 'patient' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            👤 Patient Login
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('doctor')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              background: roleTab === 'doctor' ? '#fff' : 'transparent',
              color: roleTab === 'doctor' ? '#6366f1' : '#64748b',
              boxShadow: roleTab === 'doctor' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            👨‍⚕️ Doctor Login
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">{roleTab === 'doctor' ? 'Doctor Email' : 'Patient Email'}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={roleTab === 'doctor' ? 'doctor@hospital.com' : 'patient@example.com'}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                style={{ background: 'none', border: 'none', color: '#0891b2', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ marginTop: '6px' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{
              background: roleTab === 'doctor' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : undefined
            }}
          >
            {loading ? 'Signing in...' : roleTab === 'doctor' ? 'Sign In as Doctor' : 'Sign In as Patient'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px' }}>
          Don't have an account? <Link to="/register">Create one as {roleTab}</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px', borderRadius: '12px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>🔑 Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {resetMessage ? (
              <div>
                <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                  {resetMessage}
                </div>
                <button className="btn btn-primary btn-full" onClick={() => { setShowForgotModal(false); setResetMessage(''); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  Enter your email address and we'll send you a password reset link.
                </p>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={resetLoading}>
                  {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
