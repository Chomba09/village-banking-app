import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import {
  Users, PiggyBank, HandCoins, AlertCircle,
  CheckCircle2, Clock, FileText, TrendingUp
} from 'lucide-react'

function ChairpersonGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [groupRes, noticesRes] = await Promise.all([
        api.get(`/groups/${groupId}/`),
        api.get(`/notices/group/${groupId}/`),
      ])
      setGroup(groupRes.data)
      setNotices(noticesRes.data)

      // Pull dashboard stats from the treasurer endpoint — chairperson has read access
      try {
        const dashRes = await api.get('/dashboard/treasurer/')
        const groupData = dashRes.data.groups.find(
          g => String(g.group_id) === String(groupId)
        )
        setDashboard(groupData || null)
      } catch {
        setDashboard(null)
      }
    } catch (err) {
      setError('Failed to load group details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading group details...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const cycle = group.active_cycle

  return (
    <DashboardLayout title={group.name}>
      <button className="back-btn" onClick={() => navigate('/chairperson/dashboard')}>
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div>
          <h1 className="dashboard-title">{group.name}</h1>
          {group.description && (
            <p className="dashboard-subtitle">{group.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/chairperson/groups/${groupId}/cycle-report`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={14} />
            Cycle Report
          </button>
        </div>
      </div>

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
            gap: '16px',
          }}>
            {[
              { label: 'Start Date', value: cycle.start_date },
              { label: 'End Date', value: cycle.end_date },
              { label: 'Stop Saving', value: cycle.stop_saving_date },
              { label: 'Stop Borrowing', value: cycle.stop_borrowing_date },
              { label: 'Interest Rate', value: `${group.interest_rate}%` },
              { label: 'Min Contribution', value: `K${Number(group.minimum_contribution).toFixed(2)}` },
              {
                label: 'Max Contribution',
                value: Number(group.maximum_contribution) === 0
                  ? 'No limit'
                  : `K${Number(group.maximum_contribution).toFixed(2)}`,
              },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginBottom: '4px',
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      {dashboard && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PiggyBank size={16} color="var(--accent-primary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Savings</div>
            </div>
            <div className="stat-card-value">K{Number(dashboard.total_contributions).toFixed(2)}</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--accent-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HandCoins size={16} color="var(--accent-secondary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Loans Issued</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>
              K{Number(dashboard.total_loans_issued).toFixed(2)}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--crimson-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="var(--crimson-500)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Outstanding Balance</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--crimson-500)' }}>
              K{Number(dashboard.outstanding_balance).toFixed(2)}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--yellow-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="var(--yellow-700)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Pending Loan Requests</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--yellow-700)' }}>
              {dashboard.pending_loan_applications}
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid #4a8c55' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#4a8c55" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Repaid</div>
            </div>
            <div className="stat-card-value" style={{ color: '#4a8c55' }}>
              K{Number(dashboard.total_repaid).toFixed(2)}
            </div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid #7c3aed' }}
            onClick={() => navigate(`/chairperson/members`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={16} color="#7c3aed" />
              <div className="stat-card-title" style={{ margin: 0 }}>Members</div>
            </div>
            <div className="stat-card-value" style={{ color: '#7c3aed' }}>
              {dashboard.members_count}
            </div>
            <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '6px' }}>Manage members →</div>
          </div>
        </div>
      )}

      {/* My personal records */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div className="table-card">
          <div className="table-card-header" style={{ borderBottom: '2px solid var(--accent-primary)' }}>
            <PiggyBank size={15} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
            My Contributions
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              View your personal savings contributions for this group.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/chairperson/transactions')}
              >
                View My Contributions
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                onClick={() => navigate('/chairperson/contribute')}
              >
                Make Contribution
              </button>
            </div>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header" style={{ borderBottom: '2px solid var(--accent-secondary)' }}>
            <HandCoins size={15} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-secondary)' }} />
            My Loans
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Track your personal loan applications and repayments.
            </p>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--accent-secondary)', color: 'white', border: 'none' }}
              onClick={() => navigate('/chairperson/apply-loan')}
            >
              View My Loans
            </button>
          </div>
        </div>

        <div
          className="table-card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/chairperson/approvals')}
        >
          <div className="table-card-header" style={{ borderBottom: '2px solid #7c3aed' }}>
            <TrendingUp size={15} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#7c3aed' }} />
            Loan Approvals
          </div>
          <div style={{ padding: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Review and approve or reject pending loan applications from members.
            </p>
            <button
              className="btn btn-sm"
              style={{ background: '#7c3aed', color: 'white', border: 'none' }}
            >
              Go to Approvals →
            </button>
          </div>
        </div>
      </div>

      {/* Penalty settings — read-only */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">Penalty Settings</div>
        <div style={{
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
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
                marginBottom: '4px',
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--crimson-500)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notices — read-only for chairperson */}
      <div className="table-card">
        <div className="table-card-header">
          Group Notices ({notices.length})
        </div>
        {notices.length === 0 ? (
          <div className="empty-state">No notices posted yet.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {notice.title}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '8px' }}>
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

export default ChairpersonGroupDetail
