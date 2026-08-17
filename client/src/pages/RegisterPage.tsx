import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [clinicName, setClinicName] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({ 
        name, 
        email, 
        password, 
        role,
        ...(role === 'doctor' && {
          specialty,
          clinicName,
          consultationFee: consultationFee ? Number(consultationFee) : 0
        })
      });
      if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/welcome');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#0F172A',
    background: '#F8FAFC',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
    marginBottom: '6px',
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#FFFFFF',
    }}>
      {/* Left Navy Panel */}
      <div style={{
        width: '40%',
        background: 'linear-gradient(165deg, #0A1628 0%, #1B2A4A 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative orb */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '-60px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)',
          filter: 'blur(30px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Medical icon */}
          <div style={{ marginBottom: '28px' }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="16" fill="rgba(59,130,246,0.15)" />
              <path d="M28 14v28M14 28h28" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <circle cx="28" cy="28" r="18" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.3" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '30px',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}>
            MedSummary AI
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7,
            maxWidth: '280px',
          }}>
            Join thousands of patients and doctors managing health records intelligently.
          </p>

          {/* Trust points */}
          <div style={{
            marginTop: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'flex-start',
            textAlign: 'left',
            margin: '48px auto 0',
            maxWidth: '220px',
          }}>
            {['🔒 Bank-grade encryption', '🤖 AI-powered insights', '👨‍⚕️ Doctor verified'].map(t => (
              <div key={t} style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.3px',
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '26px',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '6px',
          }}>
            Create an account
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#64748B',
            marginBottom: '32px',
          }}>
            Start organizing your health records today
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#DC2626',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {error}
              </div>
            )}

            {/* Role Toggle */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '24px',
              background: '#F1F5F9',
              borderRadius: '12px',
              padding: '4px',
            }}>
              {(['patient', 'doctor'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: role === r ? '#0A1628' : 'transparent',
                    color: role === r ? '#FFFFFF' : '#64748B',
                    boxShadow: role === r ? '0 2px 8px rgba(10,22,40,0.2)' : 'none',
                  }}
                >
                  {r === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle} htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoFocus
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {role === 'doctor' && (
              <>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle} htmlFor="specialty">Specialty</label>
                  <select
                    id="specialty"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Nephrology">Nephrology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Endocrinology">Endocrinology</option>
                  </select>
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle} htmlFor="clinicName">Clinic / Hospital Name</label>
                  <input
                    id="clinicName"
                    type="text"
                    value={clinicName}
                    onChange={e => setClinicName(e.target.value)}
                    placeholder="e.g. City Health Center"
                    required
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle} htmlFor="consultationFee">Consultation Fee (₹)</label>
                  <input
                    id="consultationFee"
                    type="number"
                    value={consultationFee}
                    onChange={e => setConsultationFee(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                borderRadius: '12px',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                color: '#FFFFFF',
                background: role === 'doctor'
                  ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                  : 'linear-gradient(135deg, #0A1628, #1B2A4A)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(10,22,40,0.25)',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#64748B',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
