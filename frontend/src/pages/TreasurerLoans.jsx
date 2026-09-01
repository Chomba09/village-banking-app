import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerLoans() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [approvalData, setApprovalData] = useState({})

  useEffect(() => {
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
    fetchLoans()
  }, [groupId])

  const handleApprovalChange = (loanId, field, value) => {
    setApprovalData({
      ...approvalData,
      [loanId]: { ...approvalData[loanId], [field]: value }
    })
  }

  const handleApprove = async (loanId) => {
    const data = approvalData[loanId] || {}
    if (!data.interest_rate) {
      alert('Please enter an interest rate before approving.')
      return
    }
    if (!data.due_date) {
      alert('Please enter a due date before approving.')
      return
    }
    setUpdating(loanId)
    try {
      await api.patch(`/loans/${loanId}/status/`, {
        status: 'approved',
        interest_rate: data.interest_rate,
        due_date: data.due_date,
      })
      setLoans(loans.map(l =>
        l.id === loanId ? { ...l, status: 'approved', interest_rate: data.interest_rate, due_date: data.due_date } : l
      ))
    } catch (err) {
      alert('Failed to approve loan. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async (loanId) => {
    setUpdating(loanId)
    try {
      await api.patch(`/loans/${loanId}/status/`, { status: 'rejected' })
      setLoans(loans.map(l =>
        l.id === loanId ? { ...l, status: 'rejected' } : l
      ))
    } catch (err) {
      alert('Failed to reject loan. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading">Loading loans...</div>

  return (
    <DashboardLayout title="Loans Management">
      <div>
        <button
          onClick={() => navigate('/treasurer/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a56db', fontSize: '14px', marginBottom: '4px' }}
        >
          ← Back to Dashboard
        </button>

        <h1 className="dashboard-title">Loans Management</h1>
        <p className="dashboard-subtitle">Review loan applications and manage approvals.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loans.length === 0 ? (
          <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No loan applications found for this group yet.
          </div>
        ) : (
          <div>
            {loans.map((loan) => (
              <div key={loan.id} className="table-card" style={{ marginBottom: '16px' }}>
                <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Loan #{loan.id} — {loan.member_username}</span>
                  <span className={`badge badge-${loan.status}`}>{loan.status}</span>
                </div>

                <div style={{ padding: '16px' }}>
                  <div className="stats-grid" style={{ margin: '0 0 16px 0' }}>
                    <div className="stat-card">
                      <div className="stat-card-title">Amount</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>K{Number(loan.amount).toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-title">Interest Rate</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>
                        {loan.interest_rate ? `${loan.interest_rate}%` : 'Not set'}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-title">Total Due</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>K{Number(loan.total_due).toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-title">Balance Remaining</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>K{Number(loan.balance_remaining).toFixed(2)}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '8px' }}>
                    <strong>Purpose:</strong> {loan.purpose || '—'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '16px' }}>
                    <strong>Applied:</strong> {new Date(loan.applied_at).toLocaleDateString()}
                    {loan.due_date && <> &nbsp;|&nbsp; <strong>Due:</strong> {loan.due_date}</>}
                  </p>

                  {loan.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ margin: '0' }}>
                        <label>Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5.00"
                          style={{ width: '140px', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
                          onChange={(e) => handleApprovalChange(loan.id, 'interest_rate', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: '0' }}>
                        <label>Due Date</label>
                        <input
                          type="date"
                          style={{ width: '160px', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
                          onChange={(e) => handleApprovalChange(loan.id, 'due_date', e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0' }}
                        disabled={updating === loan.id}
                        onClick={() => handleApprove(loan.id)}
                      >
                        {updating === loan.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0', backgroundColor: '#fee2e2', color: '#b91c1c' }}
                        disabled={updating === loan.id}
                        onClick={() => handleReject(loan.id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {loan.repayments && loan.repayments.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>Repayments</p>
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
      </div>
    </DashboardLayout>
  )
}

export default TreasurerLoans