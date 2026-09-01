import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/transactions/withdrawals/pending/')
      setWithdrawals(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, newStatus) => {
    setUpdating(id)
    try {
      await api.patch(`/transactions/withdrawals/${id}/approve/`, { status: newStatus })
      setWithdrawals(withdrawals.filter(w => w.id !== id))
    } catch (err) {
      alert(err.response?.data?.non_field_errors?.[0] || 'Failed to update withdrawal.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading">Loading withdrawals...</div>

  return (
    <DashboardLayout title="Withdrawal Approvals">
      <h1 className="dashboard-title">Pending Withdrawals</h1>
      <p className="dashboard-subtitle">Review and approve member withdrawal requests.</p>

      <div className="table-card">
        {withdrawals.length === 0 ? (
          <div className="empty-state">No pending withdrawal requests.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>{w.member_username}</td>
                  <td>{w.group_name}</td>
                  <td>K{Number(w.amount).toFixed(2)}</td>
                  <td>{w.note || '—'}</td>
                  <td>{new Date(w.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={updating === w.id}
                        onClick={() => handleUpdate(w.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={updating === w.id}
                        onClick={() => handleUpdate(w.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TreasurerWithdrawals