import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function MemberApplyLoan() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    group: '',
    amount: '',
    purpose: '',
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
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/loans/apply/', formData)
      setSuccess('Loan application submitted successfully! The treasurer will review your request.')
      setFormData({ group: '', amount: '', purpose: '' })
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit loan application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <DashboardLayout title="Apply for a Loan">
      <button className="back-btn" onClick={() => navigate('/member/dashboard')}>
        ← Back to Dashboard
      </button>
      <h1 className="dashboard-title">Apply for a Loan</h1>
      <p className="dashboard-subtitle">Submit a loan request to your group treasurer.</p>

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
            <label>Amount (K)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter loan amount"
              step="0.01"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Purpose / Brief Description</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Briefly describe why you need this loan"
              rows={3}
              required
            />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            The treasurer will review your application and set the interest rate and due date upon approval.
          </p>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default MemberApplyLoan