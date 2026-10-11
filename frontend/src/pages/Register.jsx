import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../api/axios'

// Extracts the first meaningful error message from a DRF error response.
// DRF can return errors as:
//   { field: ["message"] }  OR  { detail: "message" }  OR  { non_field_errors: ["msg"] }
function parseApiError(err, fallback = 'Something went wrong. Please try again.') {
  const data = err.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data

  // non_field_errors first, then each field in order
  const order = ['non_field_errors', 'detail', 'username', 'email', 'password', 'phone_number', 'role']
  for (const key of order) {
    if (data[key]) {
      const val = data[key]
      return Array.isArray(val) ? val[0] : String(val)
    }
  }
  // Any remaining field
  for (const key of Object.keys(data)) {
    const val = data[key]
    const msg = Array.isArray(val) ? val[0] : String(val)
    // Prefix with the field name so the user knows which field is the problem
    return `${key.replace(/_/g, ' ')}: ${msg}`
  }
  return fallback
}

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'member',
    phone_number: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/accounts/register/', formData)
      navigate('/login')
    } catch (err) {
      setError(parseApiError(err, 'Registration failed. Please check your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const inputWrap = { position: 'relative' }
  const eyeBtn = {
    position: 'absolute', right: '10px', top: '50%',
    transform: 'translateY(-50%)', background: 'none',
    border: 'none', cursor: 'pointer', padding: '4px',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="auth-left-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
          </div>
          <span className="auth-left-brand-name">Smart Banking</span>
        </div>
        <div className="auth-left-content">
          <h1 className="auth-left-tagline">
            Join Your <span>Community</span>
          </h1>
          <p className="auth-left-desc">
            Create your account to start saving with your group,
            applying for loans, and tracking your finances.
          </p>
        </div>
        <div className="auth-left-footer">
          © 2026 Smart Banking. All rights reserved.
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Fill in your details to get started</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={inputWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  required
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.password.length > 0 && formData.password.length < 8 && (
                <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  Password must be at least 8 characters.
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div style={inputWrap}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== formData.password && (
                <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  Passwords do not match.
                </p>
              )}
              {confirmPassword.length > 0 && confirmPassword === formData.password && formData.password.length >= 8 && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                  Passwords match ✓
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="treasurer">Treasurer</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
            <p style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              By registering you agree to our{' '}
              <span
                style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }}
                onClick={() => navigate('/terms')}
              >
                Terms & Privacy Policy
              </span>
            </p>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
