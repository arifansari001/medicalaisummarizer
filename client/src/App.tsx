import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import AddEventPage from './pages/AddEventPage';
import EventDetailPage from './pages/EventDetailPage';
import TimelinePage from './pages/TimelinePage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import DoctorSharedRecordPage from './pages/DoctorSharedRecordPage';
import SharedReportView from './components/SharedReportView';
import DoctorDirectoryPage from './pages/DoctorDirectoryPage';
import MedicalStorePage from './pages/MedicalStorePage';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import PharmacyShopPage from './pages/PharmacyShopPage';
import WelcomePage from './pages/WelcomePage';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/shared/:token" element={<SharedReportView />} />
          <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />

          {/* Protected Authenticated Routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            <Route path="/history" element={<MedicalHistoryPage />} />
            <Route path="/history/new" element={<AddEventPage />} />
            <Route path="/history/:id" element={<EventDetailPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/doctors" element={<DoctorDirectoryPage />} />
            <Route path="/stores" element={<MedicalStorePage />} />
            <Route path="/pharmacy" element={<PharmacyShopPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
            <Route path="/doctor/share/:id" element={<DoctorSharedRecordPage />} />
          </Route>

          {/* Redirects & 404 */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
}
