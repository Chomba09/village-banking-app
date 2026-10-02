import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { FileText } from 'lucide-react'

function ArchivedGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/groups/${groupId}/`)
      .then(res => setGroup(res.data))
      .catch(() => setError('Failed to load archived group.'))
      .finally(() => setLoading(false))
  }, [groupId])

  if (loading) return <div className="loading">Loading archived group...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const cycle = group.active_cycle

  return (
    <DashboardLayout title={`${group.name} (Archived)`}>
      <button
        className="back-btn"
        onClick={() => navigate('/treasurer/dashboard')}
      >
        ← Back to Dashboard
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '4px'
      }}>
        <h1 className="dashboard-title">{group.name}</h1>
        <span style={{
          fontSize: '12px',
          background: 'var(--gray-200)',
          color: 'var(--gray-600)',
          padding: '3px 12px',
          borderRadius: '20px',
          fontWeight: '700'
        }}>
          ARCHIVED
        </span>
      </div>
      <p className="dashboard-subtitle">
        This group has been closed. All records are preserved for reference.
      </p>

      {/* View cycle report button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(`/treasurer/groups/archived/${groupId}/cycle-report`)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '24px'
        }}
      >
        <FileText size={14} />
        View Cycle Report
      </button>

      {/* Cycle info */}
      {cycle && (
        <div className="table-card" style={{ marginBottom: '24px' }}>
          <div className="table-card-header">
            Last Cycle — {cycle.cycle_name}
          </div>
          <div style={{
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {[
              { label: 'Start Date', value: cycle.start_date },
              { label: 'End Date', value: cycle.end_date },
              { label: 'Interest Rate', value: `${group.interest_rate}%` },
              { label: 'Min Contribution', value: `K${Number(group.minimum_contribution).toFixed(2)}` },
              { label: 'Max Contribution', value: Number(group.maximum_contribution) === 0 ? 'No limit' : `K${Number(group.maximum_contribution).toFixed(2)}` },
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
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">
          Members ({group.members?.length || 0})
        </div>
        {!group.members || group.members.length === 0 ? (
          <div className="empty-state">No members on record.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map(member => (
                <tr key={member.id}>
                  <td>{member.username}</td>
                  <td>
                    {member.first_name || member.last_name
                      ? `${member.first_name} ${member.last_name}`.trim()
                      : '—'}
                  </td>
                  <td>{member.email || '—'}</td>
                  <td>{member.phone_number || '—'}</td>
                  <td>
                    <span className={`badge badge-${member.role === 'treasurer' ? 'approved' : 'contribution'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(member.date_joined).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Penalties */}
      <div className="table-card">
        <div className="table-card-header">Penalty Settings</div>
        <div style={{
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px'
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
                marginBottom: '4px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--crimson-500)'
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ArchivedGroupDetail