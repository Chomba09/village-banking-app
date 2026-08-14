import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function TreasurerDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/treasurer/')
        setDashboardData(response.data)
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <h1 className="dashboard-title">Treasurer Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back, {dashboardData.treasurer}. Here is your group overview.
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-title">Total Groups</div>
            <div className="stat-card-value">{dashboardData.total_groups}</div>
          </div>
        </div>

        {dashboardData.groups.map((group) => (
          <div key={group.group_id} className="table-card" style={{ marginBottom: '32px' }}>
            <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{group.group_name}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0' }}
                  onClick={() => navigate(`/treasurer/groups/${group.group_id}/contributions`)}
                >
                  Contributions
                </button>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0' }}
                  onClick={() => navigate(`/treasurer/groups/${group.group_id}/loans`)}
                >
                  Loans
                </button>
              </div>
            </div>

            <div className="stats-grid" style={{ padding: '16px', margin: '0' }}>
              <div className="stat-card">
                <div className="stat-card-title">Members</div>
                <div className="stat-card-value">{group.members_count}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Total Contributions</div>
                <div className="stat-card-value">K{Number(group.total_contributions).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Loans Issued</div>
                <div className="stat-card-value">K{Number(group.total_loans_issued).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Outstanding Balance</div>
                <div className="stat-card-value">K{Number(group.outstanding_balance).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Pending Loan Applications</div>
                <div className="stat-card-value">{group.pending_loan_applications}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Total Repaid</div>
                <div className="stat-card-value">K{Number(group.total_repaid).toFixed(2)}</div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '12px 24px' }}
            onClick={() => navigate('/treasurer/groups/create')}
          >
            + Create New Group
          </button>
        </div>
      </div>
    </div>
  )
}

export default TreasurerDashboard