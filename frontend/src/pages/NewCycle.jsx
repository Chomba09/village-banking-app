import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { RefreshCw } from 'lucide-react'

function NewCycle() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    cycle_name: '',
    start_date: '',
    end_date: '',
    stop_saving_date: '',
    stop_borrowing_date: '',
    member_admission_deadline: '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post(`/groups/${groupId}/new-cycle/`, formData)
      setSuccess(true)
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const first = Object.values(errors)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError('Failed to start new cycle.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout title="New Cycle Started">
        <div style={{ maxWidth: '480px' }}>
          <div className="table-card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <RefreshCw size={48} color="var(--accent-primary)" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              New Cycle Started!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              All group members have been notified about the new cycle.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/treasurer/groups/${groupId}`)}
            >
              Back to Group
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Start New Cycle">
      <button className="back-btn" onClick={() => navigate(`/treasurer/groups/${groupId}`)}>
        ← Back to Group
      </button>
      <h1 className="dashboard-title">Start a New Cycle</h1>
      <p className="dashboard-subtitle">
        The current cycle will be archived and a new one will begin.
        All group members will be notified automatically.
      </p>

      <div style={{ maxWidth: '520px' }}>
        <div className="table-card" style={{ padding: '28px' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cycle Name *</label>
              <input
                type="text"
                name="cycle_name"
                value={formData.cycle_name}
                onChange={handleChange}
                placeholder="e.g. Cycle 2 — 2027"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stop Saving Date *</label>
                <input
                  type="date"
                  name="stop_saving_date"
                  value={formData.stop_saving_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Stop Borrowing Date *</label>
                <input
                  type="date"
                  name="stop_borrowing_date"
                  value={formData.stop_borrowing_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Member Admission Deadline *</label>
                <input
                  type="date"
                  name="member_admission_deadline"
                  value={formData.member_admission_deadline}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Start New Cycle'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(`/treasurer/groups/${groupId}`)}
                style={{ width: 'auto', padding: '11px 20px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default NewCycle