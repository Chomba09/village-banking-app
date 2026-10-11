import { useState, useEffect } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import api from '../api/axios'

// Extracts the first meaningful error from a DRF response object.
function parseApiError(err, fallback) {
  const data = err.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  const order = ['non_field_errors', 'detail', 'old_password', 'new_password']
  for (const key of order) {
    if (data[key]) {
      const val = data[key]
      return Array.isArray(val) ? val[0] : String(val)
    }
  }
  for (const key of Object.keys(data)) {
    const val = data[key]
    return Array.isArray(val) ? val[0] : String(val)
  }
  return fallback
}

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute', right: '10px', top: '50%',
        transform: 'translateY(-50%)', background: 'none',
        border: 'none', cursor: 'pointer', padding: '4px',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
      }}
    >
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )
}

function ProfileDrawer({ open, onClose }) {
  const [profile, setProfile] = useState({
    username: '', email: '', first_name: '',
    last_name: '', phone_number: '', role: '',
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '', new_password: '', confirm_new: '',
  })
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)

  useEffect(() => {
    if (open) {
      api.get('/accounts/profile/').then(res => setProfile(res.data))
    }
  }, [open])

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setProfileSuccess('')
    setProfileError('')
    try {
      await api.patch('/accounts/profile/', {
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
      })
      setProfileSuccess('Profile updated successfully.')
      localStorage.setItem('username', profile.username)
    } catch {
      setProfileError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordSuccess('')
    setPasswordError('')

    // Client-side check first so user gets instant feedback
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (passwordData.new_password === passwordData.old_password) {
      setPasswordError('New password must be different from your current password.')
      return
    }
    if (passwordData.new_password !== passwordData.confirm_new) {
      setPasswordError('New passwords do not match. Please re-enter them.')
      return
    }

    setChangingPassword(true)
    try {
      await api.post('/accounts/password/change/', passwordData)
      setPasswordSuccess('Password changed successfully.')
      setPasswordData({ old_password: '', new_password: '', confirm_new: '' })
      setShowOld(false)
      setShowNew(false)
    } catch (err) {
      setPasswordError(
        parseApiError(err, 'Failed to change password. Please check your current password and try again.')
      )
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`profile-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>My Profile</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="drawer-body">
          <div className="drawer-avatar">
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
              {profile.username}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
              {profile.role}
            </div>
          </div>

          <div className="drawer-section-title">Personal Information</div>

          {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
          {profileError && <div className="alert alert-error">{profileError}</div>}

          <form onSubmit={handleProfileSave}>
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="first_name" value={profile.first_name}
                onChange={handleProfileChange} placeholder="Enter first name" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="last_name" value={profile.last_name}
                onChange={handleProfileChange} placeholder="Enter last name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={profile.email}
                onChange={handleProfileChange} placeholder="Enter email" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone_number" value={profile.phone_number}
                onChange={handleProfileChange} placeholder="Enter phone number" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="drawer-section-title">Change Password</div>

          {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
          {passwordError && <div className="alert alert-error">{passwordError}</div>}

          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showOld ? 'text' : 'password'}
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                  style={{ paddingRight: '38px' }}
                />
                <EyeToggle show={showOld} onToggle={() => setShowOld(v => !v)} />
              </div>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 8 characters"
                  required
                  style={{ paddingRight: '38px' }}
                />
                <EyeToggle show={showNew} onToggle={() => setShowNew(v => !v)} />
              </div>
              {passwordData.new_password.length > 0 && passwordData.new_password.length < 8 && (
                <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  Password must be at least 8 characters.
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmNew ? 'text' : 'password'}
                  name="confirm_new"
                  value={passwordData.confirm_new}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                  required
                  style={{ paddingRight: '38px' }}
                />
                <EyeToggle show={showConfirmNew} onToggle={() => setShowConfirmNew(v => !v)} />
              </div>
              {passwordData.confirm_new.length > 0 && passwordData.confirm_new !== passwordData.new_password && (
                <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  Passwords do not match.
                </p>
              )}
              {passwordData.confirm_new.length > 0 && passwordData.confirm_new === passwordData.new_password && passwordData.new_password.length >= 8 && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                  Passwords match ✓
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default ProfileDrawer
