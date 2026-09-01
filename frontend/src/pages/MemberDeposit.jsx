import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function MemberDeposit() {
  const [groups, setGroups] = useState([])
  const [accounts, setAccounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    group: '',
    amount: '',
    note: '',
    transaction_type: 'deposit',
  })

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/')
        setGroups(response.data)
        for (const group of response.data) {
          const accRes = await api.get(`/transactions/account/${group.id}/`)
          setAccounts(prev => ({ ...prev, [group.id]: accRes.data.balance }))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess('')
    setError('')
    try {
      await api.post('/transactions/deposit-withdraw/', formData)
      const txType = formData.transaction_type
      if (txType === 'deposit') {
        setSuccess('Deposit successful! Your account balance has been updated.')
        const accRes = await api.get(`/transactions/account/${formData.group}/`)
        setAccounts(prev => ({ ...prev, [formData.group]: accRes.data.balance }))
      } else {
        setSuccess('Withdrawal request submitted. Waiting for treasurer approval.')
      }
      setFormData({ group: '', amount: '', note: '', transaction_type: 'deposit' })
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Transaction failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <DashboardLayout title="Deposit / Withdraw">
      <h1 className="dashboard-title">Deposit & Withdraw</h1>
      <p className="dashboard-subtitle">Manage your account funds.</p>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {groups.map(group => (
          <div key={group.id} className="stat-card stat-card-accent">
            <div className="stat-card-title">{group.name} — Balance</div>
            <div className="stat-card-value">
              K{Number(accounts[group.id] || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="table-card" style={{ padding: '24px', maxWidth: '480px' }}>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group</label>
            <select
              name="group"
              value={formData.group}
              onChange={handleChange}
              required
            >
              <option value="">Select a group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Transaction Type</label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (K)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 500"
              step="0.01"
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
              placeholder="e.g. Monthly savings deposit"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Submit'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default MemberDeposit