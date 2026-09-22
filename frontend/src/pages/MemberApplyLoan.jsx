import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Info } from 'lucide-react'

function MemberApplyLoan() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [availability, setAvailability] = useState(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)

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
      setLoadingAvailability(true)
      setAvailability(null)
      api.get(`/groups/${formData.group}/loan-availability/`)
        .then(res => setAvailability(res.data))
        .catch(() => setAvailability(null))
        .finally(() => setLoadingAvailability(false))
    } else {
      setAvailability(null)
    }
  }, [formData.group])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (availability && Number(formData.amount) > Number(availability.available_amount)) {
      setError(
        `Loan amount exceeds the available pool. Maximum available: K${Number(availability.available_amount).toFixed(2)}.`
      )
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/loans/apply/', formData)
      setSuccess('Loan application submitted successfully! The treasurer will review your request.')
      setFormData({ group: '', amount: '', purpose: '' })
      setAvailability(null)
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.amount?.[0] ||
        'Failed to submit loan application.'
      )
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
      <p className="dashboard-subtitle">
        Submit a loan request to your group treasurer.
      </p>

      <div style={{ maxWidth: '520px' }}>
        {/* Availability info card */}
        {availability && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '20px',
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
                { label: 'Total Group Savings', value: `K${Number(availability.total_savings).toFixed(2)}` },
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
                    color: item.highlight ? 'var(--accent-primary)' : 'var(--text-primary)'
                  }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {Number(availability.available_amount) === 0 && (
              <div className="alert alert-error" style={{ marginTop: '12px', marginBottom: '0' }}>
                No funds are currently available for borrowing in this group.
              </div>
            )}
          </div>
        )}

        {loadingAvailability && (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            Checking available amount...
          </div>
        )}

        <div className="table-card" style={{ padding: '24px' }}>
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
              <label>
                Amount (K) *
                {availability && Number(availability.available_amount) > 0 && (
                  <span style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontWeight: '400',
                    marginLeft: '8px'
                  }}>
                    Max: K{Number(availability.available_amount).toFixed(2)}
                  </span>
                )}
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter loan amount"
                step="0.01"
                min="1"
                max={availability ? Number(availability.available_amount) : undefined}
                required
              />
            </div>

            <div className="form-group">
              <label>Purpose / Brief Description *</label>
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
              The treasurer will review your application and set the interest rate
              and due date upon approval.
            </p>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                submitting ||
                !availability ||
                Number(availability.available_amount) === 0
              }
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MemberApplyLoan