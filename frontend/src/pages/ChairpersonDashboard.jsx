import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { CheckSquare, Users, TrendingUp, AlertCircle } from 'lucide-react'

function ChairpersonDashboard() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        // Load groups this user belongs to (they will be chair of some)
        const [groupsRes, memberRes] = await Promise.all([
          api.get('/groups/'),
          api.get('/auth/me/'),
        ])
        setGroups(groupsRes.data)
        setUsername(memberRes.data.username)

        // Count pending loans across all chaired groups
        try {
          const loansRes = await api.get('/loans/chairperson/pending/')
          setPendingCount(loansRes.data.length)
        } catch {
          setPendingCount(0)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="loading">Loading dashboard...</div>

  // Filter to only groups where current user is chairperson
  const chairedGroups = groups.filter(g => {
    const userId = parseInt(localStorage.getItem('user_id'))
    return g.chairperson_id === userId
  })

  return (
    <DashboardLayout title="Chairperson Dashboard">
      <h1 className="dashboard-title">Chairperson Dashboard</h1>
      <p className="dashboard-subtitle">
        Welcome back, {username}. You are responsible for approving loans in your groups.
      </p>

      {/* Alert if there are pending loans */}
      {pendingCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            color: 'white',
            boxShadow: 'var(--shadow-md)',
          }}
          onClick={() => navigate('/chairperson/approvals')}
        >
          <AlertCircle size={22} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>
              {pendingCount} loan{pendingCount !== 1 ? 's' : ''} awaiting your approval
            </div>
            <div style={{ fontSize: '13px', opacity: 0.85 }}>
              Click to review and approve or reject
            </div>
          </div>
          <span style={{ fontSize: '20px' }}>→</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/chairperson/approvals')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <CheckSquare size={18} color="var(--accent-primary)" />
            <div className="stat-card-title">Pending Approvals</div>
          </div>
          <div className="stat-card-value" style={{ color: pendingCount > 0 ? '#7c3aed' : 'var(--text-primary)' }}>
            {pendingCount}
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Users size={18} color="var(--accent-secondary)" />
            <div className="stat-card-title">Groups Chaired</div>
          </div>
          <div className="stat-card-value">{chairedGroups.length}</div>
        </div>
      </div>

      {/* Chaired groups */}
      {chairedGroups.length === 0 ? (
        <div className="empty-state">
          You are not currently listed as chairperson of any group.
        </div>
      ) : (
        <div>
          <h2 style={{
            fontSize: '15px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <TrendingUp size={16} color="var(--accent-primary)" />
            Your Groups
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {chairedGroups.map((group) => (
              <div
                key={group.id}
                className="table-card"
                style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                onClick={() => navigate(`/chairperson/groups/${group.id}`)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <div className="table-card-header" style={{ borderBottom: '2px solid #7c3aed' }}>
                  <span style={{ fontWeight: '700' }}>{group.name}</span>
                  <span style={{
                    fontSize: '11px',
                    background: '#7c3aed',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontWeight: '600',
                  }}>
                    {group.members?.length ?? 0} members
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      Cycle
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {group.active_cycle?.cycle_name ?? 'None'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                      Treasurer
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {group.treasurer}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: '#7c3aed',
                  fontWeight: '600',
                  textAlign: 'right',
                }}>
                  View group →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other groups (member but not chair) */}
      {groups.filter(g => {
        const userId = parseInt(localStorage.getItem('user_id'))
        return g.chairperson_id !== userId
      }).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}>
            Other Groups (Member)
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
          }}>
            {groups
              .filter(g => {
                const userId = parseInt(localStorage.getItem('user_id'))
                return g.chairperson_id !== userId
              })
              .map((group) => (
                <div
                  key={group.id}
                  className="table-card"
                  style={{ cursor: 'pointer', opacity: 0.8 }}
                  onClick={() => navigate(`/member/groups/${group.id}`)}
                >
                  <div className="table-card-header">
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{group.name}</span>
                  </div>
                  <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {group.active_cycle?.cycle_name ?? 'No active cycle'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ChairpersonDashboard
