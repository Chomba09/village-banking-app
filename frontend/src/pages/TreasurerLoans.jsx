import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerLoans() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'all'

  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchLoans()
  }, [groupId])

  const fetchLoans = async () => {
    try {
      const response = await api.get(`/loans/group/${groupId}/`)
      setLoans(response.data)
    } catch (err) {
      setError('Failed to load loans.')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLoans = () => {
    switch (currentFilter) {
      case 'approved':
        return loans.filter(l => l.status === 'approved')
      case 'outstanding':
        return loans.filter(l =>
          l.status === 'approved' && Number(l.balance_remaining) > 0
        )
      case 'pending':
        return loans.filter(l => l.status === 'pending')
      case 'repaid':
        return loans.filter(l =>
          l.repayments && l.repayments.length > 0
        )
      default:
        return loans
    }
  }

  const getFilterLabel = () => {
    switch (currentFilter) {
      case 'approved': return 'Approved Loans'
      case 'outstanding': return 'Outstanding Balances'
      case 'pending': return 'Pending Loan Requests'
      case 'repaid': return 'Loans with Repayments'
      default: return 'All Loans'
    }
  }

  const handleApprove = async (loanId) => {
    setUpdating(loanId)
    try {
      await api.patch(`/loans/${loanId}/status/`, {
        status: 'approved',
      })
      await fetchLoans()
    } catch (err) {
      alert(err.response?.data?.non_field_errors?.[0] || 'Failed to approve loan.')
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async (loanId) => {
    setUpdating(loanId)
    try {
      await api.patch(`/loans/${loanId}/status/`, { status: 'rejected' })
      await fetchLoans()
    } catch (err) {
      alert('Failed to reject loan. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const filteredLoans = getFilteredLoans()

  if (loading) return <div className="loading">Loading loans...</div>

  return (
    <DashboardLayout title="Loans Management">
      <button
        className="back-btn"
        onClick={() => navigate(`/treasurer/groups/${groupId}`)}
      >
        ← Back to Group
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 className="dashboard-title">Loans Management</h1>
          <p className="dashboard-subtitle">
            Showing: <strong style={{ color: 'var(--accent-primary)' }}>
              {getFilterLabel()}
            </strong> — {filteredLoans.length} loan{filteredLoans.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'outstanding', label: 'Outstanding' },
            { key: 'repaid', label: 'Repaid' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ filter: tab.key })}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                background: currentFilter === tab.key
                  ? 'var(--accent-primary)'
                  : 'transparent',
                color: currentFilter === tab.key
                  ? 'white'
                  : 'var(--text-secondary)',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {filteredLoans.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            No loans found for the selected filter.
          </div>
        </div>
      ) : (
        <div>
          {filteredLoans.map((loan) => (
            <div
              key={loan.id}
              className="table-card"
              style={{ marginBottom: '16px' }}
            >
              <div className="table-card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Loan #{loan.id} — {loan.member_username}</span>
                <span className={`badge badge-${loan.status}`}>
                  {loan.status}
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <div className="stats-grid" style={{ margin: '0 0 16px 0' }}>
                  <div className="stat-card">
                    <div className="stat-card-title">Amount</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      K{Number(loan.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-title">Interest Rate</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      {loan.interest_rate ? `${loan.interest_rate}%` : 'Not set'}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-title">Total Due</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      K{Number(loan.total_due).toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-title">Balance Remaining</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      K{Number(loan.balance_remaining).toFixed(2)}
                    </div>
                  </div>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}>
                  <strong>Purpose:</strong> {loan.purpose || '—'}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  <strong>Applied:</strong>{' '}
                  {new Date(loan.applied_at).toLocaleDateString()}
                  {loan.due_date && (
                    <> &nbsp;|&nbsp; <strong>Due:</strong> {loan.due_date}</>
                  )}
                </p>

                {/* Pending — approve or reject */}
                {loan.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                    padding: '12px 16px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px'
                      }}>
                        Will be approved with:
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap'
                      }}>
                        <span>
                          <strong>Interest Rate:</strong> {loan.group_interest_rate || 'Set in group'}%
                        </span>
                        <span>
                          <strong>Due Date:</strong> {loan.cycle_end_date || 'Cycle end date'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={updating === loan.id}
                        onClick={() => handleApprove(loan.id)}
                      >
                        {updating === loan.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={updating === loan.id}
                        onClick={() => handleReject(loan.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Repayments history */}
                {loan.repayments && loan.repayments.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      marginBottom: '8px'
                    }}>
                      Repayment History
                    </p>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loan.repayments.map((repayment) => (
                          <tr key={repayment.id}>
                            <td>{repayment.date}</td>
                            <td>K{Number(repayment.amount).toFixed(2)}</td>
                            <td>{repayment.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default TreasurerLoans