import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerContributions() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await api.get(`/contributions/group/${groupId}/`)
        setContributions(response.data)
      } catch (err) {
        setError('Failed to load contributions.')
      } finally {
        setLoading(false)
      }
    }
    fetchContributions()
  }, [groupId])

  const handleStatusUpdate = async (contributionId, newStatus) => {
    setUpdating(contributionId)
    try {
      await api.patch(`/contributions/${contributionId}/status/`, { status: newStatus })
      setContributions(contributions.map(c =>
        c.id === contributionId ? { ...c, status: newStatus } : c
      ))
    } catch (err) {
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading">Loading contributions...</div>

  return (
    <DashboardLayout title="Contributions">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <button className="back-btn" onClick={() => navigate(`/treasurer/groups/${groupId}`)}>
          ← Back to Group
        </button>
        </div>

        <h1 className="dashboard-title">Contributions</h1>
        <p className="dashboard-subtitle">Review and confirm member contributions.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {contributions.length === 0 ? (
          <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No contributions found for this group yet.
          </div>
        ) : (
          <div className="table-card">
            <div className="table-card-header">
              All Contributions ({contributions.length})
            </div>
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>{contribution.member_username}</td>
                    <td>K{Number(contribution.amount).toFixed(2)}</td>
                    <td>{contribution.date}</td>
                    <td>{contribution.note || '—'}</td>
                    <td>
                      <span className={`badge badge-${contribution.status}`}>
                        {contribution.status}
                      </span>
                    </td>
                    <td>
                      {contribution.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', marginTop: '0' }}
                            disabled={updating === contribution.id}
                            onClick={() => handleStatusUpdate(contribution.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn"
                            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', marginTop: '0', backgroundColor: '#fee2e2', color: '#b91c1c' }}
                            disabled={updating === contribution.id}
                            onClick={() => handleStatusUpdate(contribution.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {contribution.status !== 'pending' && (
                        <span style={{ color: '#718096', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TreasurerContributions