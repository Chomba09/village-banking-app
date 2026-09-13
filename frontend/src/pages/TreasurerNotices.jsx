import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Bell } from 'lucide-react'

function TreasurerNotices() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    group: groupId,
    title: '',
    content: '',
  })

  useEffect(() => {
    fetchNotices()
  }, [groupId])

  const fetchNotices = async () => {
    try {
      const response = await api.get(`/notices/group/${groupId}/`)
      setNotices(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess('')
    setError('')
    try {
      await api.post('/notices/create/', formData)
      setSuccess('Notice posted successfully. All members have been notified.')
      setFormData({ group: groupId, title: '', content: '' })
      setShowForm(false)
      fetchNotices()
    } catch (err) {
      setError('Failed to post notice. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading notices...</div>

  return (
    <DashboardLayout title="Notices">
      <button className="back-btn" onClick={() => navigate(`/treasurer/groups/${groupId}`)}>
        ← Back to Group
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h1 className="dashboard-title">Group Notices</h1>
          <p className="dashboard-subtitle">Post announcements visible to all group members.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '10px 20px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Post Notice'}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
            New Notice
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Next Meeting Date"
                required
              />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your notice here..."
                rows={5}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      {notices.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">No notices posted yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}>
          {notices.map((notice) => (
            <div key={notice.id} className="table-card">
              <div className="table-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={15} color="var(--accent-primary)" />
                <span>{notice.title}</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7', marginBottom: '12px' }}>
                  {notice.content}
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Posted by {notice.posted_by_username} · {new Date(notice.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default TreasurerNotices