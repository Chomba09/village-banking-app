import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function MemberLoans() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [repaymentData, setRepaymentData] = useState({})
  const [repaying, setRepaying] = useState(null)

  const [loanForm, setLoanForm] = useState({
    amount: '',
    purpose: '',
  })

  useEffect(() => {
    fetchLoans()
  }, [groupId])

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans/my/')
      const filtered = response.data.filter(
        l => String(l.group) === String(groupId)
      )
      setLoans(filtered)
    } catch (err) {
      setError('Failed to load loans.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoanChange = (e) => {
    setLoanForm({ ...loanForm, [e.target.name]: e.target.value })
  }

  const handleLoanSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/loans/apply/', {
        group: groupId,
        amount: loanForm.amount,
        purpose: loanForm.purpose,
      })
      setSuccess('Loan application submitted! Waiting for treasurer approval.')
      setLoanForm({ amount: '', purpose: '' })
      setShowLoanForm(false)
      fetchLoans()
    } catch (err) {
      setError('Failed to submit loan application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRepaymentChange = (loanId, value) => {
    setRepaymentData({ ...repaymentData, [loanId]: value })
  }

  const handleRepayment = async (loanId) => {
    if (!repaymentData[loanId]) {
      alert('Please enter a repayment amount.')
      return
    }
    setRepaying(loanId)
    setError('')
    setSuccess('')

    try {
      await api.post('/loans/repay/', {
        loan: loanId,
        amount: repaymentData[loanId],
      })
      setSuccess('Repayment submitted successfully!')
      setRepaymentData({ ...repaymentData, [loanId]: '' })
      fetchLoans()
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit repayment.')
    } finally {
      setRepaying(null)
    }
  }

  if (loading) return <div className="loading">Loading loans...</div>

  return (
    <DashboardLayout title="My Loans">
      <div>
        <button className="back-btn" onClick={() => navigate(`/member/groups/${groupId}`)}>
          ← Back to Group
        </button>

        <h1 className="dashboard-title">My Loans</h1>
        <p className="dashboard-subtitle">Apply for loans and manage your repayments.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '10px 20px', marginBottom: '20px' }}
          onClick={() => setShowLoanForm(!showLoanForm)}
        >
          {showLoanForm ? 'Cancel' : '+ Apply for a Loan'}
        </button>

        {showLoanForm && (
          <div className="table-card" style={{ padding: '24px', maxWidth: '400px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Loan Application</h3>
            <form onSubmit={handleLoanSubmit}>
              <div className="form-group">
                <label>Amount (K)</label>
                <input
                  type="number"
                  name="amount"
                  value={loanForm.amount}
                  onChange={handleLoanChange}
                  placeholder="e.g. 1000"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Purpose</label>
                <input
                  type="text"
                  name="purpose"
                  value={loanForm.purpose}
                  onChange={handleLoanChange}
                  placeholder="e.g. School fees"
                  required
                />
              </div>
              <p style={{ fontSize: '12px', color: '#718096', marginBottom: '12px' }}>
                The treasurer will review your application and set the interest rate.
              </p>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {loans.length === 0 ? (
          <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No loan applications yet. Apply for your first loan above.
          </div>
        ) : (
          <div>
            {loans.map((loan) => (
              <div key={loan.id} className="table-card" style={{ marginBottom: '16px' }}>
                <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Loan #{loan.id}</span>
                  <span className={`badge badge-${loan.status}`}>{loan.status}</span>
                </div>

                <div style={{ padding: '16px' }}>
                  <div className="stats-grid" style={{ margin: '0 0 12px 0' }}>
                    <div className="stat-card">
                      <div className="stat-card-title">Amount</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>K{Number(loan.amount).toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-title">Interest Rate</div>
                      <div className="stat-card-value" style={{ fontSize: '18px' }}>
                        {loan.interest_rate ? `${loan.interest_rate}%` : 'Pending'}
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

                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '4px' }}>
                    <strong>Purpose:</strong> {loan.purpose || '—'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '12px' }}>
                    <strong>Applied:</strong> {new Date(loan.applied_at).toLocaleDateString()}
                    {loan.due_date && <> &nbsp;|&nbsp; <strong>Due:</strong> {loan.due_date}</>}
                  </p>

                  {loan.status === 'approved' && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                      <div className="form-group" style={{ margin: '0' }}>
                        <label>Repayment Amount (K)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Enter amount"
                          value={repaymentData[loan.id] || ''}
                          onChange={(e) => handleRepaymentChange(loan.id, e.target.value)}
                          style={{ width: '160px', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
                        />
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', marginTop: '0' }}
                        disabled={repaying === loan.id}
                        onClick={() => handleRepayment(loan.id)}
                      >
                        {repaying === loan.id ? 'Processing...' : 'Make Repayment'}
                      </button>
                    </div>
                  )}

                  {loan.repayments && loan.repayments.length > 0 && (
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
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
      </div>
    </DashboardLayout>
  )
}

export default MemberLoans