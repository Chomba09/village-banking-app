import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { PiggyBank, HandCoins, CheckCircle2, AlertCircle, Bell, Users, FileText, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react'

function MemberGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const base = role === 'chairperson' ? 'chairperson' : 'member'
  const [group, setGroup] = useState(null)
  const [memberData, setMemberData] = useState(null)
  const [notices, setNotices] = useState([])
  const [availability, setAvailability] = useState(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [penaltyAccount, setPenaltyAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAvailability = useCallback(async (showSpinner = false) => {
    if (showSpinner) setAvailabilityLoading(true)
    try {
      const res = await api.get(`/groups/${groupId}/loan-availability/`)
      setAvailability(res.data)
    } catch {
      // silently ignore
    } finally {
      if (showSpinner) setAvailabilityLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, dashRes, noticesRes, accountRes] = await Promise.all([
          api.get(`/groups/${groupId}/`),
          api.get('/dashboard/member/'),
          api.get(`/notices/group/${groupId}/`),
          api.get(`/transactions/account/${groupId}/`).catch(() => null),
        ])
        setGroup(groupRes.data)
        const groupData = dashRes.data.groups.find(
          g => String(g.group_id) === String(groupId)
        )
        setMemberData(groupData)
        setNotices(noticesRes.data)
        if (accountRes) setPenaltyAccount(accountRes.data)
      } catch (err) {
        setError('Failed to load group details.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [groupId])

  // Auto-refresh availability every 30 seconds
  useEffect(() => {
    fetchAvailability()
    const interval = setInterval(() => fetchAvailability(), 30000)
    return () => clearInterval(interval)
  }, [fetchAvailability])

  if (loading) return <div className="loading">Loading group details...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const cycle = group.active_cycle

  // Pool maths for the progress bar
  const poolTotal = availability
    ? Number(availability.total_savings) * (Number(availability.max_loan_percentage) / 100)
    : 0
  const poolUsed = availability ? Number(availability.outstanding_loans) : 0
  const poolAvailable = availability ? Number(availability.available_amount) : 0
  const poolPct = poolTotal > 0 ? Math.min(100, (poolUsed / poolTotal) * 100) : 0

  const penaltyBalance = penaltyAccount ? Number(penaltyAccount.balance) : 0

  return (
    <DashboardLayout title={group.name}>
      <button className="back-btn" onClick={() => navigate(`/${base}/dashboard`)}>
        ← Back to Dashboard
      </button>

      <h1 className="dashboard-title">{group.name}</h1>
      {group.description && (
        <p className="dashboard-subtitle">{group.description}</p>
      )}

      <button
        onClick={() => navigate(`/${base}/groups/${groupId}/cycle-report`)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-primary)', color: 'white',
          border: 'none', cursor: 'pointer', fontWeight: '600',
          fontSize: '14px', marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <FileText size={16} />
        View Cycle Report
      </button>

      {/* ── Loan Pool Availability ── */}
      {availability && (
        <div style={{
          marginBottom: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          overflow: 'hidden'
        }}>
          {/* Header bar */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={16} color="white" />
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'white', letterSpacing: '0.3px' }}>
                Loan Pool — Available Funds
              </span>
            </div>
            <button
              onClick={() => fetchAvailability(true)}
              disabled={availabilityLoading}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: '6px', padding: '5px 10px',
                cursor: availabilityLoading ? 'not-allowed' : 'pointer',
                color: 'white', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600'
              }}
            >
              <RefreshCw
                size={12}
                style={{ animation: availabilityLoading ? 'spin 1s linear infinite' : 'none' }}
              />
              {availabilityLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Four figures */}
          <div style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Total Savings
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                K{Number(availability.total_savings).toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                confirmed contributions
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Max Lendable ({availability.max_loan_percentage}%)
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                K{poolTotal.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                savings × max loan %
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Loans Outstanding
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--crimson-500)' }}>
                K{Number(availability.outstanding_loans).toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                currently lent out
              </div>
            </div>

            {/* Highlighted available box */}
            <div style={{
              background: poolAvailable <= 0 ? 'rgba(220,38,38,0.08)' : 'rgba(74,140,85,0.1)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              border: `1px solid ${poolAvailable <= 0 ? 'rgba(220,38,38,0.2)' : 'rgba(74,140,85,0.25)'}`
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Available to Borrow
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: poolAvailable <= 0 ? 'var(--crimson-500)' : '#2d7a3a' }}>
                K{poolAvailable.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {poolAvailable <= 0 ? 'pool fully exhausted' : 'ready to borrow'}
              </div>
            </div>
          </div>

          {/* Pool usage bar */}
          <div style={{ padding: '0 20px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pool usage</span>
              <span style={{
                fontSize: '12px', fontWeight: '700',
                color: poolPct >= 90 ? 'var(--crimson-500)' : 'var(--text-secondary)'
              }}>
                {poolPct.toFixed(1)}% used
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${poolPct}%`,
                borderRadius: '99px',
                background: poolPct >= 90 ? 'var(--crimson-500)' : poolPct >= 65 ? 'var(--yellow-500)' : 'var(--accent-primary)',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Updates automatically every 30 seconds as loans are issued and repaid.
            </div>
          </div>
        </div>
      )}

      {/* Cycle Info */}
      {cycle && (
        <div className="table-card" style={{ marginBottom: '24px' }}>
          <div className="table-card-header">
            Active Cycle — {cycle.cycle_name}
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
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
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
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

      {/* Member Stats */}
      {memberData && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-primary)' }}
            onClick={() => navigate(`/${base}/contributions/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PiggyBank size={16} color="var(--accent-primary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>My Contributions</div>
            </div>
            <div className="stat-card-value">K{Number(memberData.my_total_contributions).toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '6px' }}>View contributions →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-secondary)' }}
            onClick={() => navigate(`/${base}/loans/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HandCoins size={16} color="var(--accent-secondary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Borrowed</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>K{Number(memberData.total_borrowed).toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', marginTop: '6px' }}>View loans →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--crimson-500)' }}
            onClick={() => navigate(`/${base}/loans/${groupId}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="var(--crimson-500)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Outstanding Loans</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--crimson-500)' }}>{memberData.outstanding_loans.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--crimson-500)', marginTop: '6px' }}>View loans →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--purple-600)' }}
            onClick={() => navigate(`/${base}/groups/${groupId}/activity`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={16} color="var(--purple-600)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Group Activity</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '14px', color: 'var(--purple-600)' }}>View all</div>
            <div style={{ fontSize: '11px', color: 'var(--purple-600)', marginTop: '6px' }}>Contributions & loans →</div>
          </div>
        </div>
      )}

      {/* Outstanding Penalty Balance */}
      {penaltyBalance > 0 && (
        <div style={{
          marginBottom: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid rgba(185,28,28,0.35)',
          background: 'rgba(254,242,242,0.6)',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <AlertTriangle size={22} color="#b91c1c" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#b91c1c', marginBottom: '2px' }}>
              Outstanding Penalty Balance
            </div>
            <div style={{ fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
              You have an outstanding penalty of <strong>K{penaltyBalance.toFixed(2)}</strong> in this group.
              Please settle this with the treasurer.
            </div>
          </div>
          <div style={{ fontWeight: '800', fontSize: '22px', color: '#b91c1c', whiteSpace: 'nowrap' }}>
            K{penaltyBalance.toFixed(2)}
          </div>
        </div>
      )}

      {/* Penalties */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">Penalty Settings</div>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Late Loan Penalty', value: `K${Number(group.late_loan_penalty).toFixed(2)}` },
            { label: 'Late Savings Penalty', value: `K${Number(group.late_savings_penalty).toFixed(2)}` },
            { label: 'No Savings Penalty', value: `K${Number(group.no_savings_penalty).toFixed(2)}` },
            { label: 'Default Loan Penalty', value: `K${Number(group.default_loan_penalty).toFixed(2)}` },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--crimson-500)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notices */}
      <div className="table-card">
        <div className="table-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--accent-primary)" />
          <span>Notices ({notices.length})</span>
        </div>

        {notices.length === 0 ? (
          <div className="empty-state">No notices posted for this group yet.</div>
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

export default MemberGroupDetail
