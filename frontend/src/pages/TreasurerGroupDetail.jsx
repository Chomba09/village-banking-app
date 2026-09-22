import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import {
  Users, PiggyBank, HandCoins, AlertCircle,
  CheckCircle2, Clock, Copy, RefreshCw, Bell, Plus, X, Trash2
} from 'lucide-react'

function TreasurerGroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const [group, setGroup] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' })
  const [postingNotice, setPostingNotice] = useState(false)
  const [noticeSuccess, setNoticeSuccess] = useState('')
  const [noticeError, setNoticeError] = useState('')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [groupRes, dashRes, noticesRes] = await Promise.all([
        api.get(`/groups/${groupId}/`),
        api.get('/dashboard/treasurer/'),
        api.get(`/notices/group/${groupId}/`)
      ])
      setGroup(groupRes.data)
      const groupData = dashRes.data.groups.find(
        g => String(g.group_id) === String(groupId)
      )
      setDashboard(groupData)
      setNotices(noticesRes.data)
    } catch (err) {
      setError('Failed to load group details.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(group.invite_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleArchive = async () => {
  setArchiving(true)
  try {
    await api.post(`/groups/${groupId}/archive/`)
    navigate('/treasurer/dashboard')
  } catch (err) {
    alert('Failed to archive group.')
  } finally {
    setArchiving(false)
  }
}

  const handleNoticeChange = (e) => {
    setNoticeForm({ ...noticeForm, [e.target.name]: e.target.value })
  }

  const handlePostNotice = async (e) => {
    e.preventDefault()
    setPostingNotice(true)
    setNoticeSuccess('')
    setNoticeError('')
    try {
      await api.post('/notices/create/', {
        group: groupId,
        title: noticeForm.title,
        content: noticeForm.content,
      })
      setNoticeSuccess('Notice posted. All group members have been notified.')
      setNoticeForm({ title: '', content: '' })
      setShowNoticeForm(false)
      const noticesRes = await api.get(`/notices/group/${groupId}/`)
      setNotices(noticesRes.data)
    } catch (err) {
      setNoticeError('Failed to post notice. Please try again.')
    } finally {
      setPostingNotice(false)
    }
  }

  if (loading) return <div className="loading">Loading group details...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const cycle = group.active_cycle

  return (
    <DashboardLayout title={group.name}>
      <button className="back-btn" onClick={() => navigate('/treasurer/dashboard')}>
        ← Back to Dashboard
      </button>

      {showArchiveConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{
              fontSize: '17px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '10px'
            }}>
              Archive Group
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Are you sure you want to archive <strong>{group?.name}</strong>?
              All members will be notified that the group has been closed.
              All financial records will be preserved for future reference.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={archiving}
                onClick={handleArchive}
              >
                {archiving ? 'Archiving...' : 'Yes, Archive Group'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 className="dashboard-title">{group.name}</h1>
          {group.description && (
            <p className="dashboard-subtitle">{group.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/treasurer/groups/${groupId}/new-cycle`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            New Cycle
          </button>
          <button
            className="btn btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--crimson-100)',
              color: 'var(--crimson-500)',
              border: 'none'
            }}
            onClick={() => setShowArchiveConfirm(true)}
          >
            <Trash2 size={14} />
            Archive Group
          </button>
        </div>
      </div>

      {/* Cycle Info */}
      {cycle && (
        <div className="table-card" style={{ marginBottom: '24px' }}>
          <div className="table-card-header">
            Active Cycle — {cycle.cycle_name}
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Start Date', value: cycle.start_date },
              { label: 'End Date', value: cycle.end_date },
              { label: 'Stop Saving', value: cycle.stop_saving_date },
              { label: 'Stop Borrowing', value: cycle.stop_borrowing_date },
              { label: 'Admission Deadline', value: cycle.member_admission_deadline },
              { label: 'Interest Rate', value: `${group.interest_rate}%` },
              { label: 'Min Contribution', value: `K${Number(group.minimum_contribution).toFixed(2)}` },
              { label: 'Max Contribution', value: Number(group.maximum_contribution) === 0 ? 'No limit' : `K${Number(group.maximum_contribution).toFixed(2)}` },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clickable Stats */}
      {dashboard && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-primary)' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/contributions`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PiggyBank size={16} color="var(--accent-primary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Savings</div>
            </div>
            <div className="stat-card-value">K{Number(dashboard.total_contributions).toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '6px' }}>View contributions →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--accent-secondary)' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/loans?filter=approved`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HandCoins size={16} color="var(--accent-secondary)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Loans Issued</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>
              K{Number(dashboard.total_loans_issued).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', marginTop: '6px' }}>View loans →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--crimson-500)' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/loans?filter=outstanding`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="var(--crimson-500)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Outstanding Balance</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--crimson-500)' }}>
              K{Number(dashboard.outstanding_balance).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--crimson-500)', marginTop: '6px' }}>View details →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--yellow-500)' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/loans?filter=pending`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} color="var(--yellow-700)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Pending Loan Requests</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--yellow-700)' }}>
              {dashboard.pending_loan_applications}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--yellow-700)', marginTop: '6px' }}>Review requests →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid #4a8c55' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/loans?filter=repaid`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#4a8c55" />
              <div className="stat-card-title" style={{ margin: 0 }}>Total Repaid</div>
            </div>
            <div className="stat-card-value" style={{ color: '#4a8c55' }}>
              K{Number(dashboard.total_repaid).toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: '#4a8c55', marginTop: '6px' }}>View repayments →</div>
          </div>

          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--purple-600)' }}
            onClick={() => navigate(`/treasurer/groups/${groupId}/members`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={16} color="var(--purple-600)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Members</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--purple-600)' }}>
              {dashboard.members_count}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--purple-600)', marginTop: '6px' }}>View members →</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '3px solid var(--purple-600)' }}
            onClick={() => navigate(
              role === 'treasurer'
                ? `/treasurer/groups/${groupId}/activity`
                : `/member/groups/${groupId}/activity`
            )}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={16} color="var(--purple-600)" />
              <div className="stat-card-title" style={{ margin: 0 }}>Group Activity</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '14px', color: 'var(--purple-600)' }}>
              View all
            </div>
            <div style={{ fontSize: '11px', color: 'var(--purple-600)', marginTop: '6px' }}>
              Contributions & loans →
            </div>
          </div>
        </div>
      )}

      {/* Penalties */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">Penalty Settings</div>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Late Loan Penalty', value: `K${Number(group.late_loan_penalty).toFixed(2)}` },
            { label: 'Late Savings Penalty', value: `K${Number(group.late_savings_penalty).toFixed(2)}` },
            { label: 'No Savings Penalty', value: `K${Number(group.no_savings_penalty).toFixed(2)}` },
            { label: 'Default Loan Penalty', value: `K${Number(group.default_loan_penalty).toFixed(2)}` },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--crimson-500)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notices Section */}
      <div className="table-card">
        <div className="table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--accent-primary)" />
            <span>Group Notices ({notices.length})</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowNoticeForm(!showNoticeForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {showNoticeForm ? <X size={14} /> : <Plus size={14} />}
            {showNoticeForm ? 'Cancel' : 'Post Notice'}
          </button>
        </div>

        {showNoticeForm && (
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
            {noticeSuccess && <div className="alert alert-success">{noticeSuccess}</div>}
            {noticeError && <div className="alert alert-error">{noticeError}</div>}
            <form onSubmit={handlePostNotice}>
              <div className="form-group">
                <label>Notice Title *</label>
                <input
                  type="text"
                  name="title"
                  value={noticeForm.title}
                  onChange={handleNoticeChange}
                  placeholder="e.g. Next Meeting — 15 September 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea
                  name="content"
                  value={noticeForm.content}
                  onChange={handleNoticeChange}
                  placeholder="Write your notice here..."
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: 'auto', padding: '10px 24px' }}
                disabled={postingNotice}
              >
                {postingNotice ? 'Posting...' : 'Post Notice'}
              </button>
            </form>
          </div>
        )}

        {notices.length === 0 ? (
          <div className="empty-state">No notices posted yet. Click Post Notice to add one.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {notice.title}
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '8px' }}>
                {notice.content}
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Posted by {notice.posted_by_username} · {new Date(notice.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}

export default TreasurerGroupDetail