import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function MemberMakeContribution() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)

  const [formData, setFormData] = useState({ group: '', amount: '', note: '' })

  useEffect(() => {
    api.get('/groups/')
      .then(res => setGroups(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleGroupChange = (e) => {
    const id = e.target.value
    setFormData({ ...formData, group: id, amount: '' })
    setError('')
    setSuccess('')
    if (id) {
      const found = groups.find(g => String(g.id) === String(id))
      setSelectedGroup(found || null)
    } else {
      setSelectedGroup(null)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (e.target.name === 'amount') setError('')
  }

  const minContrib = selectedGroup ? Number(selectedGroup.minimum_contribution) : null
  const maxContrib = selectedGroup ? Number(selectedGroup.maximum_contribution) : null
  const hasMax = maxContrib !== null && maxContrib > 0
  const enteredAmount = Number(formData.amount)

  const belowMin = minContrib !== null && formData.amount !== '' && enteredAmount < minContrib
  const aboveMax = hasMax && formData.amount !== '' && enteredAmount > maxContrib
  const amountInvalid = belowMin || aboveMax

  const getAmountHint = () => {
    if (belowMin) return `Amount is below the minimum contribution of K${minContrib.toFixed(2)} for this group. Please enter at least K${minContrib.toFixed(2)}.`
    if (aboveMax) return `Amount exceeds the maximum contribution of K${maxContrib.toFixed(2)} for this group. Please enter K${maxContrib.toFixed(2)} or less.`
    if (minContrib !== null && formData.amount !== '' && enteredAmount > 0 && !amountInvalid) return '✓ Amount is within the allowed range.'
    return null
  }

  const hint = getAmountHint()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (belowMin) {
      setError(`Your contribution of K${enteredAmount.toFixed(2)} is below the minimum of K${minContrib.toFixed(2)} for this group.`)
      return
    }
    if (aboveMax) {
      setError(`Your contribution of K${enteredAmount.toFixed(2)} exceeds the maximum of K${maxContrib.toFixed(2)} for this group.`)
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/contributions/make/', formData)
      setSuccess('Contribution submitted successfully! Waiting for treasurer confirmation.')
      setFormData({ group: '', amount: '', note: '' })
      setSelectedGroup(null)
    } catch (err) {
      const data = err.response?.data
      setError(data?.non_field_errors?.[0] || data?.amount?.[0] || data?.detail || 'Failed to submit contribution.')
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

      <div style={{ maxWidth: '480px' }}>
        {selectedGroup && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            marginBottom: '20px', borderLeft: '3px solid var(--accent-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Info size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Contribution Rules — {selectedGroup.name}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Minimum Contribution</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>K{minContrib.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Maximum Contribution</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {hasMax ? `K${maxContrib.toFixed(2)}` : 'No limit'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="table-card" style={{ padding: '24px' }}>
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Group *</label>
              <select name="group" value={formData.group} onChange={handleGroupChange} required>
                <option value="">Choose a group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                Amount (K) *
                {selectedGroup && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '8px' }}>
                    Min: K{minContrib.toFixed(2)}{hasMax ? ` — Max: K${maxContrib.toFixed(2)}` : ''}
                  </span>
                )}
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder={selectedGroup ? `K${minContrib.toFixed(2)} or more` : 'Select a group first'}
                step="0.01"
                min={minContrib || 1}
                max={hasMax ? maxContrib : undefined}
                required
                disabled={!selectedGroup}
                style={{ borderColor: amountInvalid ? '#b91c1c' : undefined }}
              />
              {hint && (
                <p style={{ fontSize: '12px', marginTop: '4px', color: amountInvalid ? '#b91c1c' : '#16a34a' }}>
                  {hint}
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Note <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span></label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="e.g. August contribution"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedGroup || amountInvalid}>
              {submitting ? 'Submitting...' : 'Submit Contribution'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MemberMakeContribution
