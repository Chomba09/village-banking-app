import { useState, useEffect } from 'react'
import api from '../api/axios'
import { X } from 'lucide-react'

function ProfileDrawer({ open, onClose }) {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: '',
  })

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
  })

  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

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
    setChangingPassword(true)
    setPasswordSuccess('')
    setPasswordError('')
    try {
      await api.post('/accounts/password/change/', passwordData)
      setPasswordSuccess('Password changed successfully.')
      setPasswordData({ old_password: '', new_password: '' })
    } catch (err) {
      setPasswordError(
        err.response?.data?.old_password?.[0] || 'Failed to change password.'
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
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleProfileChange}
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleProfileChange}
                placeholder="Enter last name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleProfileChange}
                placeholder="Enter phone number"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="drawer-section-title">Change Password</div>

          {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
          {passwordError && <div className="alert alert-error">{passwordError}</div>}

          <form onSubmit={handlePasswordSave}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder="Minimum 8 characters"
                required
              />
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