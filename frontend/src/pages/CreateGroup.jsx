import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Copy, CheckCircle2 } from 'lucide-react'

function CreateGroup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_person: '',
    maximum_members: '',
    minimum_contribution: '',
    maximum_contribution: '0',
    interest_rate: '',
    late_loan_penalty: '',
    late_savings_penalty: '',
    no_savings_penalty: '',
    default_loan_penalty: '',
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
      const response = await api.post('/groups/create/', formData)
      setInviteLink(response.data.invite_link)
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const first = Object.values(errors)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError('Failed to create group. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const SectionTitle = ({ children }) => (
    <div style={{
      fontSize: '12px',
      fontWeight: '700',
      color: 'var(--accent-primary)',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      margin: '24px 0 14px',
      paddingBottom: '8px',
      borderBottom: '1px solid var(--border-color)'
    }}>
      {children}
    </div>
  )

  if (inviteLink) {
    return (
      <DashboardLayout title="Group Created">
        <div style={{ maxWidth: '520px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center'
          }}>
            <CheckCircle2
              size={52}
              color="var(--accent-primary)"
              strokeWidth={1.5}
              style={{ marginBottom: '16px' }}
            />
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Group Created Successfully!
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '28px'
            }}>
              Share this invite link with members so they can join the group.
            </p>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              fontSize: '13px',
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              textAlign: 'left',
              lineHeight: '1.6'
            }}>
              {inviteLink}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCopy}
              style={{ marginBottom: '12px' }}
            >
              <Copy size={15} />
              {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>

            <button
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => navigate('/treasurer/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Create New Group">
      <button className="back-btn" onClick={() => navigate('/treasurer/dashboard')}>
        ← Back to Dashboard
      </button>
      <h1 className="dashboard-title">Create a New Group</h1>
      <p className="dashboard-subtitle">
        Fill in all the details below to set up your village banking group.
      </p>

      <div style={{ maxWidth: '680px' }}>
        <div className="table-card" style={{ padding: '28px' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>

            <SectionTitle>Group Information</SectionTitle>

            <div className="form-group">
              <label>Group Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Munali Savings Group"
                required
              />
            </div>

            <div className="form-group">
              <label>Group Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the group's purpose"
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Contact Person (Phone) *</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="e.g. 0971234567"
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Members *</label>
                <input
                  type="number"
                  name="maximum_members"
                  value={formData.maximum_members}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  min="1"
                  required
                />
              </div>
            </div>

            <SectionTitle>Cycle Information</SectionTitle>

            <div className="form-group">
              <label>Cycle Name *</label>
              <input
                type="text"
                name="cycle_name"
                value={formData.cycle_name}
                onChange={handleChange}
                placeholder="e.g. Cycle 1 — 2026"
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

            <SectionTitle>Financial Settings</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Interest Rate (%) *</label>
                <input
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  placeholder="e.g. 5.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Minimum Contribution (K) *</label>
                <input
                  type="number"
                  name="minimum_contribution"
                  value={formData.minimum_contribution}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  step="10"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Contribution (K)</label>
                <input
                  type="number"
                  name="maximum_contribution"
                  value={formData.maximum_contribution}
                  onChange={handleChange}
                  placeholder="0 = no maximum"
                  step="10"
                  min="0"
                />
              </div>
            </div>

            <SectionTitle>Penalty Settings</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Late Loan Penalty (K)</label>
                <input
                  type="number"
                  name="late_loan_penalty"
                  value={formData.late_loan_penalty}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Late Savings Penalty (K)</label>
                <input
                  type="number"
                  name="late_savings_penalty"
                  value={formData.late_savings_penalty}
                  onChange={handleChange}
                  placeholder="e.g. 30"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>No Savings Penalty (K)</label>
                <input
                  type="number"
                  name="no_savings_penalty"
                  value={formData.no_savings_penalty}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Default Loan Penalty (K)</label>
                <input
                  type="number"
                  name="default_loan_penalty"
                  value={formData.default_loan_penalty}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Creating Group...' : 'Create Group'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/treasurer/dashboard')}
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

export default CreateGroup