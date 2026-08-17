import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F6F8FA',
      fontFamily: "'DM Sans', sans-serif",
      color: '#1E293B',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Navbar */}
      <header style={{
        height: '70px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏥</span>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '22px', fontWeight: 700, color: '#0F2A2E' }}>
            MedSummary AI
          </span>
        </div>
        <button
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#14B8A6',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '999px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.25)'
          }}
        >
          Explore Portal →
        </button>
      </header>

      {/* Hero Banner with Doctor Background (BeMedic style) */}
      <section style={{
        minHeight: '480px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(246, 248, 250, 0.95) 45%, rgba(20, 184, 166, 0.1) 100%)',
        padding: '0 8%',
        borderBottom: '1px solid #E2E8F0'
      }}>
        {/* Doctor Image Backdrop */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: '5%',
          bottom: 0,
          width: '45%',
          backgroundImage: 'url("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1200&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          opacity: 0.85,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
          zIndex: 1
        }} />

        <div style={{ maxWidth: '580px', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            backgroundColor: 'rgba(20, 184, 166, 0.12)',
            color: '#14B8A6',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}>
            ✦ Intelligent Healthcare
          </div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '44px',
            fontWeight: 800,
            color: '#0F2A2E',
            lineHeight: 1.15,
            marginBottom: '16px'
          }}>
            The highest standard of health care
          </h1>
          <p style={{
            fontSize: '17px',
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            Access your AI health summaries, prescription details, diagnostic test bookings, and doctor consultations — all in one calming place.
          </p>

          <button
            onClick={() => navigate('/home')}
            style={{
              backgroundColor: '#14B8A6',
              color: '#FFFFFF',
              border: 'none',
              padding: '16px 36px',
              borderRadius: '12px',
              fontFamily: "'Outfit', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(20, 184, 166, 0.3)',
              transition: 'all 0.25s ease'
            }}
          >
            Get Started →
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid (BeMedic 4-column style) */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px',
        flex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {[
            { icon: '💊', title: 'Medication', desc: 'Prescription parsing & medicine ordering' },
            { icon: '❤️', title: 'Health Trends', desc: 'Track blood pressure, vitals & AI insights' },
            { icon: '🩺', title: 'Doctor Consult', desc: 'Find certified specialists near you' },
            { icon: '🔬', title: 'Lab Diagnostics', desc: 'Book home sample collection & reports' }
          ].map((item) => (
            <div
              key={item.title}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '28px 24px',
                border: '1.5px solid #E2E8F0',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                margin: '0 auto 16px auto'
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 600, color: '#0F2A2E', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ECG Heartbeat Graphic Decorative Line at Bottom */}
      <div style={{
        height: '40px',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20' fill='none' stroke='%2314B8A6' stroke-width='1.5'%3E%3Cpath d='M0,10 L30,10 L35,2 L40,18 L45,6 L50,10 L100,10'/%3E%3C/svg%3E\")",
        backgroundSize: '100px 30px',
        backgroundRepeat: 'repeat-x',
        opacity: 0.25
      }} />
    </div>
  );
}
