import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Info } from 'lucide-react'

function TreasurerApplyLoan() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [availability, setAvailability] = useState(null)

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

  useEffect(() => {
    if (formData.group) {
      api.get(`/groups/${formData.group}/loan-availability/`)
        .then(res => setAvailability(res.data))
        .catch(() => setAvailability(null))
    } else {
      setAvailability(null)
    }
  }, [formData.group])

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
      setSuccess(
        'Loan application submitted. It will be visible to all '
        + 'group members as a treasurer loan request.'
      )
      setFormData({ group: '', amount: '', purpose: '' })
      setAvailability(null)
    } catch (err) {
      const errData = err.response?.data
      const msg = errData?.non_field_errors?.[0] ||
        errData?.amount?.[0] ||
        errData?.group?.[0] ||
        'Failed to submit loan application.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <DashboardLayout title="Apply for a Loan">
      <button className="back-btn" onClick={() => navigate('/treasurer/dashboard')}>
        ← Back to Dashboard
      </button>
      <h1 className="dashboard-title">Apply for a Loan</h1>
      <p className="dashboard-subtitle">
        Your loan request will be visible to all group members
        as a treasurer loan request.
      </p>

      {availability && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '20px',
          maxWidth: '480px',
          borderLeft: '3px solid var(--accent-primary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Info size={15} color="var(--accent-primary)" />
            <span style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              Loan Availability
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {[
              { label: 'Total Savings', value: `K${Number(availability.total_savings).toFixed(2)}` },
              { label: 'Max Loan %', value: `${availability.max_loan_percentage}%` },
              { label: 'Outstanding Loans', value: `K${Number(availability.outstanding_loans).toFixed(2)}` },
              { label: 'Available to Borrow', value: `K${Number(availability.available_amount).toFixed(2)}`, highlight: true },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '2px'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: item.highlight
                    ? 'var(--accent-primary)'
                    : 'var(--text-primary)'
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-card" style={{ padding: '24px', maxWidth: '480px' }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Group *</label>
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
            <label>Amount (K) *</label>
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
            <label>Purpose *</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Briefly describe why you need this loan"
              rows={3}
              required
            />
          </div>

          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            lineHeight: '1.6'
          }}>
            Since you are the treasurer, your loan request will need
            to be self-approved. All members will be notified and
            can see this request for full transparency.
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default TreasurerApplyLoan