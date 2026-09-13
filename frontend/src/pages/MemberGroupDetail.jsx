import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { PiggyBank, HandCoins, CheckCircle2, AlertCircle, Bell } from 'lucide-react'

function MemberGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [memberData, setMemberData] = useState(null)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, dashRes, noticesRes] = await Promise.all([
          api.get(`/groups/${groupId}/`),
          api.get('/dashboard/member/'),
          api.get(`/notices/group/${groupId}/`)
        ])
        setGroup(groupRes.data)
        const groupData = dashRes.data.groups.find(
          g => String(g.group_id) === String(groupId)
        )
        setMemberData(groupData)
        setNotices(noticesRes.data)
      } catch (err) {
        setError('Failed to load group details.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [groupId])

  if (loading) return <div className="loading">Loading group details...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const cycle = group.active_cycle

  return (
    <DashboardLayout title={group.name}>
      <button className="back-btn" onClick={() => navigate('/member/dashboard')}>
        ← Back to Dashboard
      </button>

      <h1 className="dashboard-title">{group.name}</h1>
      {group.description && (
        <p className="dashboard-subtitle">{group.description}</p>
      )}

      {/* Cycle Info */}
      {cycle && (
        <div className="table-card" style={{ marginBottom: '24px' }}>
          <div className="table-card-header">
            Active Cycle — {cycle.cycle_name}
          </div>
          <div style={{
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {[
              { label: 'Start Date', value: cycle.start_date },
              { label: 'End Date', value: cycle.end_date },
              { label: 'Stop Saving', value: cycle.stop_saving_date },
              { label: 'Stop Borrowing', value: cycle.stop_borrowing_date },
              { label: 'Admission Deadline', value: cycle.member_admission_deadline },
              { label: 'Interest Rate', value: `${group.interest_rate}%` },
              { label: 'Min Contribution', value: `K${Number(group.minimum_contribution).toFixed(2)}` },
              { label: 'Max Contribution', value: Number(group.maximum_contribution) === 0 ? 'No limit' : `K${Number(group.maximum_contribution).toFixed(2)}` },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Stats — read only, clickable */}
      {memberData && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-primary)' }}
            onClick={() => navigate(`/member/contributions/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PiggyBank size={16} color="var(--accent-primary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>My Contributions</div>
            </div>
            <div className="stat-card-value">
              K{Number(memberData.my_total_contributions).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '6px' }}>
              View contributions →
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid #4a8c55' }}
            onClick={() => navigate(`/member/contributions/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#4a8c55" />
              <div className="stat-card-title" style={{ margin: 0 }}>Confirmed Savings</div>
            </div>
            <div className="stat-card-value" style={{ color: '#4a8c55' }}>
              K{Number(memberData.my_confirmed_contributions).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#4a8c55', marginTop: '6px' }}>
              View contributions →
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-secondary)' }}
            onClick={() => navigate(`/member/loans/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HandCoins size={16} color="var(--accent-secondary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Borrowed</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>
              K{Number(memberData.total_borrowed).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', marginTop: '6px' }}>
              View loans →
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--crimson-500)' }}
            onClick={() => navigate(`/member/loans/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="var(--crimson-500)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Outstanding Loans</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--crimson-500)' }}>
              {memberData.outstanding_loans.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--crimson-500)', marginTop: '6px' }}>
              View loans →
            </div>
          </div>
        </div>
      )}

      {/* Penalties */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">Penalty Settings</div>
        <div style={{
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'Late Loan Penalty', value: `K${Number(group.late_loan_penalty).toFixed(2)}` },
            { label: 'Late Savings Penalty', value: `K${Number(group.late_savings_penalty).toFixed(2)}` },
            { label: 'No Savings Penalty', value: `K${Number(group.no_savings_penalty).toFixed(2)}` },
            { label: 'Default Loan Penalty', value: `K${Number(group.default_loan_penalty).toFixed(2)}` },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginBottom: '4px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--crimson-500)'
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notices */}
      <div className="table-card">
        <div className="table-card-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Bell size={16} color="var(--accent-primary)" />
          <span>Notices ({notices.length})</span>
        </div>

        {notices.length === 0 ? (
          <div className="empty-state">No notices posted for this group yet.</div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div style={{
                fontWeight: '600',
                fontSize: '14px',
                color: 'var(--text-primary)',
                marginBottom: '6px'
              }}>
                {notice.title}
              </div>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '8px'
              }}>
                {notice.content}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Posted by {notice.posted_by_username} · {new Date(notice.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default MemberGroupDetail