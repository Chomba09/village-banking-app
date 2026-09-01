import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function CreateGroup() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/groups/create/', formData)
      setInviteLink(response.data.invite_link)
    } catch (err) {
      setError('Failed to create group. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Create New Group">
      <div>
        <h1 className="dashboard-title">Create a New Group</h1>
        <p className="dashboard-subtitle">Fill in the details below to create a savings group.</p>

        {!inviteLink ? (
          <div className="table-card" style={{ padding: '24px', maxWidth: '500px' }}>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Lusaka Savings Group"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the group"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
                  onClick={() => navigate('/treasurer/dashboard')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="table-card" style={{ padding: '24px', maxWidth: '500px' }}>
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              ✅ Group created successfully!
            </div>

            <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>
              Share this invite link with members so they can join the group:
            </p>

            <div style={{
              background: '#f0f4f8',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              wordBreak: 'break-all',
              marginBottom: '20px',
              color: '#1a56db'
            }}>
              {inviteLink}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink)
                alert('Invite link copied to clipboard!')
              }}
              style={{ marginBottom: '12px' }}
            >
              Copy Invite Link
            </button>

            <button
              className="btn"
              style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
              onClick={() => navigate('/treasurer/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CreateGroup