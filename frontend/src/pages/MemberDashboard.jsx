import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function MemberDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/member/')
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
        <h1 className="dashboard-title">Member Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back, {dashboardData.member}. Here is your financial overview.
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-title">Groups Joined</div>
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
                  onClick={() => navigate(`/member/contributions/${group.group_id}`)}
                >
                  My Contributions
                </button>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0' }}
                  onClick={() => navigate(`/member/loans/${group.group_id}`)}
                >
                  My Loans
                </button>
              </div>
            </div>

            <div className="stats-grid" style={{ padding: '16px', margin: '0' }}>
              <div className="stat-card">
                <div className="stat-card-title">Total Contributions</div>
                <div className="stat-card-value">K{Number(group.my_total_contributions).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Confirmed Contributions</div>
                <div className="stat-card-value">K{Number(group.my_confirmed_contributions).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Total Borrowed</div>
                <div className="stat-card-value">K{Number(group.total_borrowed).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-title">Outstanding Loans</div>
                <div className="stat-card-value">{group.outstanding_loans.length}</div>
              </div>
            </div>

            {group.outstanding_loans.length > 0 && (
              <div style={{ padding: '0 16px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                  Active Loans
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Interest</th>
                      <th>Total Due</th>
                      <th>Repaid</th>
                      <th>Balance</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.outstanding_loans.map((loan) => (
                      <tr key={loan.loan_id}>
                        <td>K{Number(loan.amount).toFixed(2)}</td>
                        <td>{loan.interest_rate}%</td>
                        <td>K{Number(loan.total_due).toFixed(2)}</td>
                        <td>K{Number(loan.total_repaid).toFixed(2)}</td>
                        <td>K{Number(loan.balance_remaining).toFixed(2)}</td>
                        <td>{loan.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MemberDashboard