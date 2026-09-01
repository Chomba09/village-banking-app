import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function MemberMakeContribution() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    group: '',
    amount: '',
    note: '',
  })

  useEffect(() => {
    api.get('/groups/').then(res => {
      setGroups(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    if (amount % 10 !== 0) {
      setError('Amount must be in multiples of 10.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/contributions/make/', formData)
      setSuccess('Contribution submitted successfully! Waiting for treasurer confirmation.')
      setFormData({ group: '', amount: '', note: '' })
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit contribution.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <DashboardLayout title="Make a Contribution">
      <button className="back-btn" onClick={() => navigate('/member/dashboard')}>
        ← Back to Dashboard
      </button>
      <h1 className="dashboard-title">Make a Contribution</h1>
      <p className="dashboard-subtitle">Submit your savings contribution for the group.</p>

      <div className="table-card" style={{ padding: '24px', maxWidth: '480px' }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Group</label>
            <select
              name="group"
              value={formData.group}
              onChange={handleChange}
              required
            >
              <option value="">Choose a group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount (K) — must be a multiple of 10</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 100, 200, 500"
              step="10"
              min="10"
              required
            />
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="e.g. August contribution"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Contribution'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default MemberMakeContribution