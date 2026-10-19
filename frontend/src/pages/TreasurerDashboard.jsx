import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Archive, AlertTriangle } from 'lucide-react'
import api from '../api/axios'

function TreasurerDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivedGroups, setArchivedGroups] = useState([])

  // Overdue-loan penalty: which row is asking "are you sure?", which is sending
  const [confirmingLoanId, setConfirmingLoanId] = useState(null)
  const [chargingLoanId, setChargingLoanId] = useState(null)
  const [penaltyMsg, setPenaltyMsg] = useState('')
  const [penaltyError, setPenaltyError] = useState('')

  const loadDashboard = async () => {
    const dashRes = await api.get('/dashboard/treasurer/')
    setDashboardData(dashRes.data)
  }

  const chargeLatePenalty = async (loan) => {
    setChargingLoanId(loan.loan_id)
    setPenaltyError('')
    try {
      await api.post('/loans/apply-penalty/', {
        member_id: loan.member_id,
        group_id: loan.group_id,
        penalty_type: 'late_loan',
        loan_id: loan.loan_id,
      })
      setPenaltyMsg(
        `Late loan penalty of K${Number(loan.late_loan_penalty).toFixed(2)} charged to ${loan.member_name}. ` +
        `They have been notified.`
      )
      setTimeout(() => setPenaltyMsg(''), 6000)
      await loadDashboard() // the charged loan drops off the overdue list
    } catch (err) {
      setPenaltyError(err.response?.data?.error || 'Failed to apply penalty.')
    } finally {
      setChargingLoanId(null)
      setConfirmingLoanId(null)
    }
  }

useEffect(() => {
  const fetchData = async () => {
    try {
      await loadDashboard()
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

  const overdueLoans = dashboardData.overdue_loans || []

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
        <div className="stat-card">
          <div className="stat-card-title">Overdue Loans</div>
          <div
            className="stat-card-value"
            style={{ color: overdueLoans.length > 0 ? '#b91c1c' : undefined }}
          >
            {overdueLoans.length}
          </div>
        </div>
      </div>

      {penaltyMsg && (
        <div className="alert alert-success">{penaltyMsg}</div>
      )}
      {penaltyError && (
        <div className="alert alert-error">{penaltyError}</div>
      )}

      {overdueLoans.length > 0 && (
        <div className="table-card" style={{ marginBottom: '28px', border: '1px solid #fca5a5' }}>
          <div
            className="table-card-header"
            style={{ borderBottom: '2px solid #b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#b91c1c' }}>
              <AlertTriangle size={16} color="#b91c1c" />
              Overdue Loans ({overdueLoans.length})
            </span>
          </div>
          <p style={{ padding: '10px 16px 0', margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            These loans are past their due date and still have a balance. Charging the late loan
            penalty adds it to the member's account, notifies them, and removes the loan from this list.
          </p>
          {/* contain: inline-size stops the table's width from stretching the page on phones */}
          <div style={{ overflowX: 'auto', padding: '8px 16px 16px', contain: 'inline-size' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <th style={{ padding: '8px 6px' }}>Member</th>
                  <th style={{ padding: '8px 6px' }}>Group</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Balance</th>
                  <th style={{ padding: '8px 6px' }}>Due Date</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Days Overdue</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {overdueLoans.map((loan) => (
                  <tr
                    key={loan.loan_id}
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    <td style={{ padding: '10px 6px', fontWeight: '600' }}>{loan.member_name}</td>
                    <td style={{ padding: '10px 6px' }}>{loan.group_name}</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '700', color: '#b91c1c' }}>
                      K{Number(loan.balance_remaining).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 6px' }}>
                      {new Date(loan.due_date).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}>
                      <span style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '12px'
                      }}>
                        {loan.days_overdue} {loan.days_overdue === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {Number(loan.late_loan_penalty) <= 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          No penalty set
                        </span>
                      ) : confirmingLoanId === loan.loan_id ? (
                        <span style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ width: 'auto', background: '#b91c1c', color: '#fff' }}
                            disabled={chargingLoanId === loan.loan_id}
                            onClick={() => chargeLatePenalty(loan)}
                          >
                            {chargingLoanId === loan.loan_id ? 'Charging…' : 'Confirm'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ width: 'auto' }}
                            disabled={chargingLoanId === loan.loan_id}
                            onClick={() => setConfirmingLoanId(null)}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: 'auto' }}
                          onClick={() => {
                            setPenaltyError('')
                            setConfirmingLoanId(loan.loan_id)
                          }}
                        >
                          Charge K{Number(loan.late_loan_penalty).toFixed(0)} penalty
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {group.overdue_count > 0 && (
                  <span style={{
                    fontSize: '11px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontWeight: '700'
                  }}>
                    {group.overdue_count} overdue
                  </span>
                )}
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