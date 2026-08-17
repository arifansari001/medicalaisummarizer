import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { title: 'AI Health Chat', description: 'Get instant AI-powered health guidance', icon: '🤖', path: '/chat', bg: '#EFF6FF' },
    { title: 'Dashboard', description: 'Your complete health overview', icon: '📊', path: '/dashboard', bg: '#F0FDF4' },
    { title: 'Medical Reports', description: 'Upload and analyze clinical records', icon: '📄', path: '/reports', bg: '#FFF7ED' },
    { title: 'Medical History', description: 'Track your health events timeline', icon: '📋', path: '/history', bg: '#FDF4FF' },
    { title: 'Health Timeline', description: 'Visualize your care journey', icon: '📈', path: '/timeline', bg: '#ECFEFF' },
    { title: 'Find Doctors', description: 'Connect with trusted specialists', icon: '👨‍⚕️', path: '/doctors', bg: '#EFF6FF' },
    { title: 'Pharmacy Shop', description: 'Order medicines & essentials', icon: '🛍️', path: '/pharmacy', bg: '#F0FDF4' },
    { title: 'Medical Store', description: 'Find nearby pharmacies & blood banks', icon: '💊', path: '/stores', bg: '#FFF7ED' },
  ];

  return (
    <div className="home-page" style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;600;700;800&display=swap');
          
          .home-hero-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
            border-radius: 0 0 32px 32px;
          }
          .home-hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(10,22,40,0.85), rgba(27,42,74,0.75));
            z-index: 1;
            border-radius: 0 0 32px 32px;
          }
          .home-hero-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            padding: 0 20px;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .home-feature-card {
            transition: all 0.3s ease;
          }
          .home-feature-card:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 12px 32px rgba(10,22,40,0.12) !important;
            border-color: #3B82F6 !important;
          }
          .btn-hover:hover {
            opacity: 0.9;
            transform: scale(1.02);
          }
        `}
      </style>

      {/* Hero Section */}
      <div className="home-hero" style={{ position: 'relative', height: '520px', borderRadius: '0 0 32px 32px', overflow: 'hidden', marginBottom: '48px' }}>
        <video 
          className="home-hero-bg"
          autoPlay 
          muted 
          loop 
          playsInline
          src="https://cdn.pixabay.com/video/2024/02/02/199079-908818188_large.mp4"
        />
        <div className="home-hero-overlay" />
        
        <div className="home-hero-content">
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.2)', 
            padding: '6px 16px', 
            borderRadius: '999px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '24px',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Welcome to MedSummary AI
          </div>
          
          <h1 style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontSize: '48px', 
            fontWeight: 800, 
            color: 'white', 
            lineHeight: 1.15,
            margin: '0 0 20px 0',
            maxWidth: '600px'
          }}>
            Your Health,<br/>Intelligently Organized.
          </h1>
          
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '17px', 
            maxWidth: '540px', 
            margin: '0 0 40px 0',
            lineHeight: 1.6
          }}>
            AI-powered medical records, smart diagnostics, pharmacy delivery — all in one secure platform.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className="btn-hover"
              onClick={() => navigate('/dashboard')}
              style={{ 
                backgroundColor: '#3B82F6', 
                color: 'white', 
                border: 'none', 
                padding: '14px 28px', 
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s ease'
              }}
            >
              Get Started →
            </button>
            <button 
              className="btn-hover"
              onClick={() => navigate('/dashboard')}
              style={{ 
                backgroundColor: 'transparent', 
                color: 'white', 
                border: '1px solid white', 
                padding: '14px 28px', 
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s ease'
              }}
            >
              View Dashboard
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', fontWeight: 500 }}>
            <span>🔒 HIPAA Compliant</span>
            <span>🤖 AI Powered</span>
            <span>⚡ Real-time</span>
            <span>👨‍⚕️ Doctor Verified</span>
          </div>
        </div>
      </div>

      {/* Feature Grid Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '32px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
            Everything you need
          </h2>
          <p style={{ color: '#64748B', fontSize: '16px', margin: 0 }}>
            Powerful tools designed around your health journey
          </p>
        </div>
        
        <div className="home-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px',
          marginBottom: '48px'
        }}>
          {quickLinks.map((link, index) => (
            <div 
              key={link.title}
              onClick={() => navigate(link.path)}
              className="home-feature-card"
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                position: 'relative',
                animation: `float 3s ease-in-out infinite`,
                animationDelay: `${index * 0.3}s`
              }}
            >
              <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#94A3B8', fontSize: '20px' }}>
                →
              </div>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                backgroundColor: link.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '20px'
              }}>
                {link.icon}
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 8px 0' }}>
                {link.title}
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                {link.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Bottom Strip */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px', 
          flexWrap: 'wrap'
        }}>
          {['🩺 Care Plans', '🤖 AI Support', '📦 Care Essentials', '🔒 Private & Secure'].map((item) => (
            <div key={item} style={{
              backgroundColor: '#F1F5F9',
              padding: '10px 20px',
              borderRadius: '999px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
