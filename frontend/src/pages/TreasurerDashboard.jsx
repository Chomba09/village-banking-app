import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Archive } from 'lucide-react'
import api from '../api/axios'

function TreasurerDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivedGroups, setArchivedGroups] = useState([])

useEffect(() => {
  const fetchData = async () => {
    try {
      const dashRes = await api.get('/dashboard/treasurer/')
      setDashboardData(dashRes.data)
    } catch (err) {
      setError('Failed to load dashboard data.')
      setLoading(false)
      return
    }
    setLoading(false)
    // Archived groups load separately so a 404 never breaks the main dashboard
    try {
      const archivedRes = await api.get('/groups/archived/')
      setArchivedGroups(archivedRes.data)
    } catch (err) {
      setArchivedGroups([])
    }
  }
  fetchData()
}, [])

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <DashboardLayout title="Treasurer Dashboard">
      <h1 className="dashboard-title">Treasurer Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome back, {dashboardData.treasurer}. Select a group to manage it.
      </p>

      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Groups</div>
          <div className="stat-card-value">{dashboardData.total_groups}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {dashboardData.groups.map((group) => (
          <div
            key={group.group_id}
            className="table-card"
            style={{ cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => {
              localStorage.setItem('active_group_id', group.group_id)
              navigate(`/treasurer/groups/${group.group_id}`)
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <div className="table-card-header" style={{ borderBottom: '2px solid var(--accent-primary)' }}>
              <span style={{ fontWeight: '700' }}>{group.group_name}</span>
              <span style={{
                fontSize: '11px',
                background: 'var(--accent-primary)',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '20px',
                fontWeight: '600'
              }}>
                {group.members_count} members
              </span>
            </div>

            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Total Savings
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  K{Number(group.total_contributions).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Loans Issued
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-secondary)' }}>
                  K{Number(group.total_loans_issued).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Outstanding
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#c62c60' }}>
                  K{Number(group.outstanding_balance).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Pending Loans
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent-tertiary)' }}>
                  {group.pending_loan_applications}
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
              Click to manage →
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '12px 24px' }}
          onClick={() => navigate('/treasurer/groups/create')}
        >
          + Create New Group
        </button>
      </div>
      {archivedGroups.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Archive size={16} />
            Archived Groups ({archivedGroups.length})
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {archivedGroups.map((group) => (
              <div
                key={group.id}
                className="table-card"
                style={{
                  cursor: 'pointer',
                  opacity: '0.75',
                  transition: 'var(--transition)'
                }}
                onClick={() => navigate(`/treasurer/groups/archived/${group.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '0.75'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div className="table-card-header" style={{
                  borderBottom: '2px solid var(--text-muted)'
                }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
                    {group.name}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    background: 'var(--gray-200)',
                    color: 'var(--gray-600)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontWeight: '600'
                  }}>
                    Archived
                  </span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--text-muted)'
                }}>
                  {group.active_cycle
                    ? `Cycle: ${group.active_cycle.cycle_name}`
                    : 'No cycle data'}
                </div>
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  textAlign: 'right'
                }}>
                  Click to view records →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default TreasurerDashboard