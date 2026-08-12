import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏥</span>
            <h2>MedSummary AI</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-section-title">Navigation</div>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📄</span>
              <span>Medical Reports</span>
            </NavLink>

            <NavLink 
              to="/history" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📋</span>
              <span>Medical History</span>
            </NavLink>

            <NavLink 
              to="/timeline" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">📅</span>
              <span>Health Timeline</span>
            </NavLink>

            <NavLink 
              to="/doctors" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">👨‍⚕️</span>
              <span>Find Doctors</span>
            </NavLink>

            <NavLink 
              to="/stores" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">💊</span>
              <span>Medical Stores</span>
            </NavLink>

            {user?.role === 'doctor' && (
              <NavLink 
                to="/doctor/dashboard" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">🩺</span>
                <span>Doctor Dashboard</span>
              </NavLink>
            )}
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">👤</span>
              <span>Profile & Privacy</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-full mt-2"
            onClick={handleLogout}
            style={{ color: '#ef4444' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Navigation"
            >
              ☰
            </button>
            <span className="topbar-title">MedSummary AI</span>
          </div>

          <div className="topbar-right">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/reports')}
            >
              + Upload Report
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
