import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { PiggyBank, HandCoins } from 'lucide-react'

function GroupActivity() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const [contributions, setContributions] = useState([])
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('contributions')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contribRes, loansRes] = await Promise.all([
          api.get(`/contributions/group/${groupId}/activity/`),
          api.get(`/loans/group/${groupId}/activity/`)
        ])
        setContributions(contribRes.data)
        setLoans(loansRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [groupId])

  const backPath = role === 'treasurer'
    ? `/treasurer/groups/${groupId}`
    : `/member/groups/${groupId}`

  if (loading) return <div className="loading">Loading group activity...</div>

  return (
    <DashboardLayout title="Group Activity">
      <button className="back-btn" onClick={() => navigate(backPath)}>
        ← Back to Group
      </button>

      <h1 className="dashboard-title">Group Activity</h1>
      <p className="dashboard-subtitle">
        Full transparency — all contributions and loan requests
        visible to every group member.
      </p>

      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px',
        width: 'fit-content',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('contributions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            background: activeTab === 'contributions'
              ? 'var(--accent-primary)'
              : 'transparent',
            color: activeTab === 'contributions'
              ? 'white'
              : 'var(--text-secondary)',
            transition: 'var(--transition)'
          }}
        >
          <PiggyBank size={15} />
          Contributions ({contributions.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            background: activeTab === 'loans'
              ? 'var(--accent-primary)'
              : 'transparent',
            color: activeTab === 'loans'
              ? 'white'
              : 'var(--text-secondary)',
            transition: 'var(--transition)'
          }}
        >
          <HandCoins size={15} />
          Loan Requests ({loans.length})
        </button>
      </div>

      {activeTab === 'contributions' && (
        <div className="table-card">
          <div className="table-card-header">
            All Contributions — {contributions.length} records
          </div>
          {contributions.length === 0 ? (
            <div className="empty-state">No contributions yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600' }}>{c.member_username}</td>
                    <td>K{Number(c.amount).toFixed(2)}</td>
                    <td>{c.date}</td>
                    <td>{c.note || '—'}</td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.submitted_by_treasurer && (
                        <span className="badge" style={{
                          background: 'var(--purple-100)',
                          color: 'var(--purple-700)'
                        }}>
                          Treasurer
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="table-card">
          <div className="table-card-header">
            All Loan Requests — {loans.length} records
          </div>
          {loans.length === 0 ? (
            <div className="empty-state">No loan requests yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: '600' }}>{l.member_username}</td>
                    <td>K{Number(l.amount).toFixed(2)}</td>
                    <td>{l.purpose || '—'}</td>
                    <td>{new Date(l.applied_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${l.status}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.submitted_by_treasurer && (
                        <span className="badge" style={{
                          background: 'var(--purple-100)',
                          color: 'var(--purple-700)'
                        }}>
                          Treasurer
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

export default GroupActivity