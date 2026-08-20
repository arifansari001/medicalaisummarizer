import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        navigate('/welcome');
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
    <>
      <style>
        {`
          .login-layout {
            display: flex;
            min-height: 100vh;
            font-family: 'DM Sans', sans-serif;
            flex-direction: column;
          }
          .login-left {
            background-color: #0A1628;
            position: relative;
            overflow: hidden;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .login-right {
            background-color: #FFFFFF;
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
          }
          
          @media (min-width: 768px) {
            .login-layout {
              flex-direction: row;
            }
            .login-left {
              width: 45%;
              padding: 60px;
              align-items: flex-start;
              text-align: left;
            }
            .login-right {
              width: 55%;
              padding: 60px;
            }
          }

          .gradient-orb {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(10,22,40,0) 70%);
            top: -100px;
            right: -100px;
            pointer-events: none;
          }

          .trust-list {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          @media (max-width: 767px) {
            .trust-list {
              display: none;
            }
            .gradient-orb {
              display: none;
            }
            .login-left {
              padding: 30px 20px;
            }
          }

          .form-card {
            width: 100%;
            max-width: 400px;
          }

          .input-field {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            color: #0F172A;
            transition: border-color 0.2s;
            box-sizing: border-box;
          }
          .input-field:focus {
            outline: none;
            border-color: #3B82F6;
          }

          .role-toggle {
            display: flex;
            background: #F1F5F9;
            border-radius: 100px;
            padding: 4px;
            margin-bottom: 32px;
          }
          .role-btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 100px;
            font-family: 'DM Sans', sans-serif;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            background: transparent;
            color: #64748B;
          }
          .role-btn.active {
            background: #0A1628;
            color: #FFFFFF;
          }
        `}
      </style>
      <div className="login-layout">
        {/* Left Panel */}
        <div className="login-left">
          <div className="gradient-orb"></div>
          
          <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '24px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" fill="#3B82F6"/>
              </svg>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", color: '#FFFFFF', fontSize: '32px', fontWeight: 700, margin: '0 0 12px 0' }}>
                MedSummary AI
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '18px', margin: 0, lineHeight: 1.5 }}>
                Your health journey, intelligently organized.
              </p>
            </div>

            <div className="trust-list">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFFFFF' }}>
                <span>🔒</span>
                <span style={{ fontSize: '15px' }}>Bank-grade encryption</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFFFFF' }}>
                <span>🤖</span>
                <span style={{ fontSize: '15px' }}>AI-powered insights</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#FFFFFF' }}>
                <span>👨‍⚕️</span>
                <span style={{ fontSize: '15px' }}>Trusted by professionals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          <div className="form-card">
            <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#0F172A', fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
              Welcome back
            </h2>
            <p style={{ color: '#64748B', margin: '0 0 32px 0', fontSize: '16px' }}>
              Sign in to continue to your health portal
            </p>

            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${roleTab === 'patient' ? 'active' : ''}`}
                onClick={() => setRoleTab('patient')}
              >
                Patient
              </button>
              <button
                type="button"
                className={`role-btn ${roleTab === 'doctor' ? 'active' : ''}`}
                onClick={() => setRoleTab('doctor')}
              >
                Doctor
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{ padding: '12px', background: '#FEF2F2', color: '#DC2626', borderRadius: '8px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 500 }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={roleTab === 'doctor' ? 'doctor@hospital.com' : 'patient@example.com'}
                  required
                  autoFocus
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="password" style={{ color: '#334155', fontSize: '14px', fontWeight: 500 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                    style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {showPassword ? (
                      /* Eye-off icon */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      /* Eye icon */
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '14px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  background: roleTab === 'doctor' 
                    ? 'linear-gradient(135deg, #3B82F6, #2563EB)' 
                    : 'linear-gradient(135deg, #0A1628, #1B2A4A)',
                  marginTop: '8px',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', borderRadius: '16px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
              <h3 className="modal-title" style={{ fontFamily: "'Outfit', sans-serif", margin: 0, fontSize: '20px', color: '#0F172A' }}>Reset Password</h3>
              <button className="modal-close-btn" onClick={() => setShowForgotModal(false)} style={{ color: '#64748B' }}>✕</button>
            </div>

            <div className="modal-body" style={{ paddingTop: '20px' }}>
              {resetMessage ? (
                <div>
                  <div style={{ padding: '16px', background: '#F0FDF4', color: '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                    {resetMessage}
                  </div>
                  <button 
                    onClick={() => { setShowForgotModal(false); setResetMessage(''); }}
                    style={{ width: '100%', padding: '12px', background: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', lineHeight: 1.5 }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '14px', fontWeight: 500 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#FFFFFF',
                      background: '#3B82F6',
                      fontWeight: 600,
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                      opacity: resetLoading ? 0.7 : 1
                    }}
                  >
                    {resetLoading ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
