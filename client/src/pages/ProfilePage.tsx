import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || 'prefer_not_to_say');
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      const res = await api.put<{ user: any }>('/users/profile', {
        name,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
      });
      updateUser(res.data.user);
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setProfileErr(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (newPassword !== confirmPassword) {
      setPassErr('New passwords do not match');
      return;
    }

    try {
      await api.put('/users/profile/password', {
        currentPassword,
        newPassword,
      });
      setPassMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassErr(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/users/profile/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medsummary_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('PERMANENT DELETION: Are you absolutely sure? All your health history, reports, and analyses will be deleted forever.')) return;
    try {
      await api.delete('/users/profile');
      logout();
    } catch (err) {
      alert('Delete account failed');
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Profile & Privacy</h1>
          <p className="card-subtitle">Manage your personal details, password, and health record data</p>
        </div>
      </div>

      <div className="profile-section card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '9999px', background: 'linear-gradient(90deg, rgb(0, 130, 124) 0%, rgb(203, 255, 252) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '500', color: '#222222', boxShadow: '0 0 25px rgba(0, 130, 124, 0.4)' }}>
            {name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '8px' }}>{user?.name}</h2>
            <p style={{ fontSize: '16px', color: '#bbc7c6' }}>{user?.email}</p>
            <p style={{ fontSize: '12px', color: '#bbc7c6', marginTop: '8px' }}>Member since {new Date(user?.createdAt || '').toLocaleDateString()}</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleUpdateProfile}>
          <h3 className="profile-section-title">Personal Information</h3>

          {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
          {profileErr && <div className="alert alert-error">{profileErr}</div>}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value as any)}>
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-sm">Save Profile Changes</button>
        </form>
      </div>

      {/* Security & Password */}
      <div className="profile-section card">
        <h3 className="profile-section-title">Change Password</h3>

        {passMsg && <div className="alert alert-success">{passMsg}</div>}
        {passErr && <div className="alert alert-error">{passErr}</div>}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">Update Password</button>
        </form>
      </div>

      {/* Data Export & Account Deletion */}
      <div className="profile-section card">
        <h3 className="profile-section-title">Export Data</h3>
        <p style={{ fontSize: '16px', color: '#bbc7c6', marginBottom: '20px' }}>Download a full JSON copy of all your medical history events, reports, and AI analyses.</p>
        <button className="btn btn-secondary btn-sm" onClick={handleExportData} disabled={isExporting}>
          {isExporting ? 'Preparing JSON Export...' : '📥 Export All Data (JSON)'}
        </button>
      </div>

      <div className="profile-section card">
        <h3 className="profile-section-title">Danger Zone</h3>
        <p style={{ fontSize: '16px', color: '#bbc7c6', marginBottom: '20px' }}>Permanently delete your account and remove all uploaded health records and AI analyses.</p>
        <button className="profile-button-danger" onClick={handleDeleteAccount}>
          🗑️ Delete Account & All Data
        </button>
      </div>
    </div>
  );
}
