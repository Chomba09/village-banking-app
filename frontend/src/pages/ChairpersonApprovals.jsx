import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

function ChairpersonApprovals() {
  const navigate = useNavigate()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans/chairperson/pending/')
      setLoans(res.data)
    } catch (err) {
      setError('Failed to load pending loan applications.')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (loanId, action) => {
    setActing(loanId)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/loans/${loanId}/chairperson-approve/`, { action })
      setSuccess(`Loan ${action === 'approve' ? 'approved' : 'rejected'} successfully.`)
      setLoans(loans.filter(l => l.id !== loanId))
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} loan.`)
    } finally {
      setActing(null)
    }
  }

  if (loading) return <div className="loading">Loading pending approvals...</div>

  return (
    <DashboardLayout title="Loan Approvals">
      <button className="back-btn" onClick={() => navigate('/chairperson/dashboard')}>
        ← Back to Dashboard
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 className="dashboard-title">Loan Approvals</h1>
        <p className="dashboard-subtitle">
          Review and approve or reject pending loan applications from group members.
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{success}</div>}

      {loans.length === 0 ? (
        <div className="table-card">
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <CheckCircle2 size={32} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No pending approvals
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              All loan applications have been reviewed.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loans.map((loan) => (
            <div key={loan.id} className="table-card">
              <div className="table-card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Loan #{loan.id} — {loan.member_username}</span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: 'var(--yellow-700)',
                  background: 'var(--yellow-100)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}>
                  <Clock size={12} />
                  Pending your approval
                </span>
              </div>

              <div style={{
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px',
                borderBottom: '1px solid var(--border-color)'
              }}>
                {[
                  { label: 'Amount Requested', value: `K${Number(loan.amount).toFixed(2)}` },
                  { label: 'Group', value: loan.group_name || `Group ${loan.group}` },
                  { label: 'Applied', value: new Date(loan.applied_at).toLocaleDateString() },
                  { label: 'Treasurer Approved', value: loan.treasurer_approved ? '✓ Yes' : '✗ Not yet' },
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
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {loan.purpose && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Purpose:{' '}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{loan.purpose}</span>
                </div>
              )}

              <div style={{ padding: '14px 16px', display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={acting === loan.id}
                  onClick={() => handleAction(loan.id, 'approve')}
                >
                  <CheckCircle2 size={14} />
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={acting === loan.id}
                  onClick={() => handleAction(loan.id, 'reject')}
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default ChairpersonApprovals
