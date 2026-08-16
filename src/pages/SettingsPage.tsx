import { KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormField } from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function SettingsPage() {
  const { admin } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(admin?.name ?? '');
  const [email, setEmail] = useState(admin?.email ?? '');
  const [mobile, setMobile] = useState(admin?.mobile ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [notifRequests, setNotifRequests] = useState(true);
  const [notifAssignments, setNotifAssignments] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    window.setTimeout(() => {
      setSavingProfile(false);
      toast.success('Admin profile updated');
    }, 700);
  };

  const handleSavePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    setPasswordError('');
    setSavingPassword(true);
    window.setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    }, 700);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Admin profile, security and notification preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <UserRound /> Admin Profile
            </h3>
          </div>
          <form className="card-body" onSubmit={handleSaveProfile}>
            <div className="form-grid">
              <FormField label="Full Name" required>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Email Address" required>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField label="Mobile" required>
                <input
                  className="input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </FormField>
              <FormField label="Role">
                <input
                  className="input"
                  value={admin?.role ?? 'ADMIN'}
                  disabled
                  aria-describedby="role-hint"
                />
              </FormField>
              <div className="info-item span-2">
                <div className="k">Login ID</div>
                <div className="v mono normal">{admin?.loginId ?? 'ADMIN01'}</div>
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton type="submit" loading={savingProfile}>
                <Save size={15} /> Save Profile
              </PrimaryButton>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <KeyRound /> Change Password
            </h3>
          </div>
          <form className="card-body" onSubmit={handleSavePassword}>
            <div className="form-grid">
              <FormField label="Current Password" required className="span-2" error={passwordError}>
                <input
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </FormField>
              <FormField label="New Password" required>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </FormField>
              <FormField label="Confirm New Password" required>
                <input
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat the new password"
                />
              </FormField>
            </div>
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton type="submit" loading={savingPassword}>
                <KeyRound size={15} /> Update Password
              </PrimaryButton>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">
              <ShieldCheck /> Notifications
            </h3>
          </div>
          <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
            <div className="setting-row">
              <span>
                <span className="sr-title">New collection requests</span>
                <div className="sr-desc">
                  Get notified when a collector submits a collection request.
                </div>
              </span>
              <ToggleSwitch
                checked={notifRequests}
                onChange={setNotifRequests}
                label="New collection requests"
              />
            </div>
            <div className="setting-row">
              <span>
                <span className="sr-title">Assignment reminders</span>
                <div className="sr-desc">Daily reminders about scheduled assignments.</div>
              </span>
              <ToggleSwitch
                checked={notifAssignments}
                onChange={setNotifAssignments}
                label="Assignment reminders"
              />
            </div>
            <div className="setting-row">
              <span>
                <span className="sr-title">System updates</span>
                <div className="sr-desc">
                  Maintenance notices and platform updates from NEPTUNE.
                </div>
              </span>
              <ToggleSwitch checked={notifSystem} onChange={setNotifSystem} label="System updates" />
            </div>
            <div className="setting-row" style={{ borderBottom: 'none', paddingBottom: 14 }}>
              <span>
                <span className="sr-title">Audit trail</span>
                <div className="sr-desc">
                  All admin actions are recorded. The full audit history is read-only.
                </div>
              </span>
              <SecondaryButton
                onClick={() => toast.info('Full audit history is available in the backend API')}
              >
                View audit trail
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}