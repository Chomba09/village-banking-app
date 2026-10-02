import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerMyContributions() {
  const navigate = useNavigate()
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/contributions/my/')
      .then(res => setContributions(res.data))
      .catch(() => setError('Failed to load contributions.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading contributions...</div>

  const total = contributions
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <DashboardLayout title="My Contributions">
      <h1 className="dashboard-title">My Contributions</h1>
      <p className="dashboard-subtitle">
        Your personal savings contributions across all groups.
      </p>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Confirmed Savings</div>
          <div className="stat-card-value">K{total.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Total Contributions</div>
          <div className="stat-card-value">{contributions.length}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-card">
        <div className="table-card-header">Contribution History</div>
        {contributions.length === 0 ? (
          <div className="empty-state">
            No contributions yet. Use Make Contribution in the sidebar.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map(c => (
                <tr key={c.id}>
                  <td>{c.group_name}</td>
                  <td>K{Number(c.amount).toFixed(2)}</td>
                  <td>{c.date}</td>
                  <td>{c.note || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status}`}>
                      {c.status}
                    </span>
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

export default TreasurerMyContributions