import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TreasurerContributions() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [contributions, setContributions] = useState([])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [contribRes, groupRes] = await Promise.all([
        api.get(`/contributions/group/${groupId}/`),
        api.get(`/groups/${groupId}/`)
      ])
      setContributions(contribRes.data)
      setGroup(groupRes.data)
    } catch (err) {
      setError('Failed to load contributions.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (contributionId) => {
    setUpdating(contributionId)
    try {
      await api.patch(
        `/contributions/${contributionId}/status/`,
        { status: 'rejected' }
      )
      setContributions(contributions.map(c =>
        c.id === contributionId ? { ...c, status: 'rejected' } : c
      ))
    } catch (err) {
      alert('Failed to reject contribution.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="loading">Loading contributions...</div>

  const minContrib = group ? Number(group.minimum_contribution).toFixed(2) : '—'
  const maxContrib = group && Number(group.maximum_contribution) > 0
    ? `K${Number(group.maximum_contribution).toFixed(2)}`
    : 'No limit'

  return (
    <DashboardLayout title="Contributions">
      <button
        className="back-btn"
        onClick={() => navigate(`/treasurer/groups/${groupId}`)}
      >
        ← Back to Group
      </button>

      <h1 className="dashboard-title">Contributions</h1>
      <p className="dashboard-subtitle">
        All contributions are automatically confirmed if within group limits.
        You can reject a contribution if something is incorrect.
      </p>

      {/* Contribution limits info */}
      {group && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap',
          borderLeft: '3px solid var(--accent-primary)'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '2px'
            }}>
              Minimum Contribution
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--accent-primary)'
            }}>
              K{minContrib}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              marginBottom: '2px'
            }}>
              Maximum Contribution
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--accent-primary)'
            }}>
              {maxContrib}
            </div>
          </div>
          {group.active_cycle && (
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginBottom: '2px'
              }}>
                Stop Saving Date
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--accent-primary)'
              }}>
                {group.active_cycle.stop_saving_date}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-card">
        <div className="table-card-header">
          All Contributions ({contributions.length})
        </div>
        {contributions.length === 0 ? (
          <div className="empty-state">
            No contributions have been made yet.
          </div>
        ) : (
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
                    {contribution.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={updating === contribution.id}
                        onClick={() => handleReject(contribution.id)}
                      >
                        Reject
                      </button>
                    )}
                    {contribution.status !== 'confirmed' && (
                      <span style={{
                        color: 'var(--text-muted)',
                        fontSize: '13px'
                      }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TreasurerContributions