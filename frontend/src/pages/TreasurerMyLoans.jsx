import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import RepaymentModal from '../components/RepaymentModal'
import api from '../api/axios'

function TreasurerMyLoans() {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [repayingLoan, setRepayingLoan] = useState(null)

  useEffect(() => { fetchLoans() }, [])

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans/my/')
      setLoans(res.data)
    } catch {
      setError('Failed to load loans.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading loans...</div>

  const totalBorrowed = loans
    .filter(l => ['approved', 'fully_paid'].includes(l.status))
    .reduce((sum, l) => sum + Number(l.amount), 0)

  const totalOutstanding = loans
    .filter(l => l.status === 'approved')
    .reduce((sum, l) => sum + Number(l.balance_remaining), 0)

  return (
    <DashboardLayout title="My Loans">
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent-primary)', fontSize: '14px',
          marginBottom: '16px', padding: '0', display: 'flex',
          alignItems: 'center', gap: '6px'
        }}
      >
        ← Back to Group
      </button>

      <h1 className="dashboard-title">My Loans</h1>
      <p className="dashboard-subtitle">Your personal loan requests and repayment history.</p>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-title">Total Borrowed</div>
          <div className="stat-card-value">K{totalBorrowed.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Outstanding Balance</div>
          <div className="stat-card-value" style={{ color: 'var(--crimson-500)' }}>
            K{totalOutstanding.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Total Loans</div>
          <div className="stat-card-value">{loans.length}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loans.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">
            No loan applications yet. Use Apply for Loan in the sidebar.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loans.map(loan => (
            <div key={loan.id} className="table-card">
              <div className="table-card-header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span>Loan #{loan.id} — {loan.group_name}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${loan.status}`}>{loan.status}</span>
                  {loan.is_overdue && (
                    <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>OVERDUE</span>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div className="stats-grid" style={{ margin: '0 0 12px 0' }}>
                  <div className="stat-card">
                    <div className="stat-card-title">Amount</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      K{Number(loan.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-title">Interest Rate</div>
                    <div className="stat-card-value" style={{ fontSize: '18px' }}>
                      {loan.interest_rate ? `${loan.interest_rate}%` : 'Pending'}
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
                    <div className="stat-card-value" style={{
                      fontSize: '18px',
                      color: Number(loan.balance_remaining) > 0 ? 'var(--crimson-500)' : '#4a8c55'
                    }}>
                      K{Number(loan.balance_remaining).toFixed(2)}
                    </div>
                  </div>
                </div>

                {loan.is_overdue && (
                  <div style={{
                    background: '#fee2e2', border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    marginBottom: '12px', fontSize: '13px', color: '#b91c1c'
                  }}>
                    <strong>This loan is overdue.</strong> A penalty of K{Number(loan.penalty_amount).toFixed(2)} has been applied.
                    Total amount now due: <strong>K{Number(loan.total_due_with_penalty).toFixed(2)}</strong>.
                  </div>
                )}

                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <strong>Purpose:</strong> {loan.purpose || '—'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <strong>Applied:</strong> {new Date(loan.applied_at).toLocaleDateString()}
                  {loan.due_date && (
                    <> &nbsp;|&nbsp; <strong>Due:</strong> {loan.due_date}</>
                  )}
                </p>

                {loan.status === 'approved' && Number(loan.balance_remaining) > 0 && (
                  <button
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '8px 20px', fontSize: '14px', marginBottom: '12px' }}
                    onClick={() => setRepayingLoan(loan)}
                  >
                    Make Repayment
                  </button>
                )}

                {loan.repayments && loan.repayments.length > 0 && (
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                        {loan.repayments.map(r => (
                          <tr key={r.id}>
                            <td>{r.date}</td>
                            <td>K{Number(r.amount).toFixed(2)}</td>
                            <td>{r.note || '—'}</td>
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

      {repayingLoan && (
        <RepaymentModal
          loan={repayingLoan}
          onClose={() => setRepayingLoan(null)}
          onSuccess={() => {
            setRepayingLoan(null)
            setSuccess('Repayment submitted successfully!')
            fetchLoans()
          }}
        />
      )}
    </DashboardLayout>
  )
}

export default TreasurerMyLoans
