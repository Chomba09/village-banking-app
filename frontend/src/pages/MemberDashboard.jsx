import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
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
    <DashboardLayout title="Member Dashboard">
      <h1 className="dashboard-title">Member Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome back, {dashboardData.member}. Select a group to view its details.
      </p>

      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-title">Groups Joined</div>
          <div className="stat-card-value">{dashboardData.total_groups}</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {dashboardData.groups.map((group) => (
          <div
            key={group.group_id}
            className="table-card"
            style={{ cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => {
              localStorage.setItem('active_group_id', group.group_id)
              navigate(`/member/groups/${group.group_id}`)
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div className="table-card-header" style={{
              borderBottom: '2px solid var(--accent-primary)'
            }}>
              <span style={{ fontWeight: '700' }}>{group.group_name}</span>
              <span style={{
                fontSize: '11px',
                background: 'var(--accent-primary)',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '20px',
                fontWeight: '600'
              }}>
                {group.outstanding_loans.length} active loan{group.outstanding_loans.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}>
                  My Contributions
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)'
                }}>
                  K{Number(group.my_total_contributions).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}>
                  Total Borrowed
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--accent-secondary)'
                }}>
                  K{Number(group.total_borrowed).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}>
                  Confirmed Savings
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#4a8c55'
                }}>
                  K{Number(group.my_confirmed_contributions).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}>
                  Outstanding Loans
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--crimson-500)'
                }}>
                  {group.outstanding_loans.length}
                </div>
              </div>
            </div>

            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border-color)',
              fontSize: '12px',
              color: 'var(--accent-primary)',
              fontWeight: '600',
              textAlign: 'right'
            }}>
              Click to view details →
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

export default MemberDashboard