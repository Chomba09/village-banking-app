import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Bell, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

function MemberNotices() {
  const navigate = useNavigate()
  const [allNotices, setAllNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const fetchAllNotices = async () => {
      try {
        const groupsRes = await api.get('/groups/')
        const groups = groupsRes.data

        const noticePromises = groups.map(group =>
          api.get(`/notices/group/${group.id}/`).then(res =>
            res.data.map(notice => ({
              ...notice,
              group_id: group.id,
              group_name: group.name,
            }))
          )
        )

        const results = await Promise.all(noticePromises)
        const combined = results
          .flat()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        setAllNotices(combined)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllNotices()
  }, [])

  const handleToggle = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  if (loading) return <div className="loading">Loading notices...</div>

  return (
    <DashboardLayout title="Notices">
      <h1 className="dashboard-title">Notices</h1>
      <p className="dashboard-subtitle">
        Announcements from all your groups, newest first.
      </p>

      {allNotices.length === 0 ? (
        <div className="table-card">
          <div className="empty-state">No notices have been posted yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '700px' }}>
          {allNotices.map((notice) => {
            const isExpanded = expandedId === notice.id
            return (
              <div
                key={notice.id}
                className="table-card"
                style={{ overflow: 'hidden', transition: 'var(--transition)' }}
              >
                {/* Notice header — always visible, click to expand */}
                <div
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                  onClick={() => handleToggle(notice.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <Bell size={13} color="var(--accent-primary)" />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'var(--accent-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}>
                        {notice.group_name}
                      </span>
                    </div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {notice.title}
                    </div>
                    {!isExpanded && (
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        lineHeight: '1.5'
                      }}>
                        {notice.content.length > 100
                          ? `${notice.content.slice(0, 100)}...`
                          : notice.content}
                      </p>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {new Date(notice.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isExpanded
                      ? <ChevronUp size={18} />
                      : <ChevronDown size={18} />
                    }
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)'
                  }}>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      lineHeight: '1.8',
                      marginBottom: '16px',
                      paddingTop: '16px'
                    }}>
                      {notice.content}
                    </p>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '16px'
                    }}>
                      Posted by {notice.posted_by_username}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        localStorage.setItem('active_group_id', notice.group_id)
                        navigate(`/member/groups/${notice.group_id}`)
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      View Group Details
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}

export default MemberNotices