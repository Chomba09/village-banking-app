import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Copy, Mail, Phone, UserX, Trash2 } from 'lucide-react'

function TreasurerGroupMembers() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      const [membersRes, groupRes] = await Promise.all([
        api.get(`/groups/${groupId}/members/`),
        api.get(`/groups/${groupId}/`)
      ])
      setMembers(membersRes.data)
      setGroup(groupRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvite = () => {
    if (group?.invite_link) {
      navigator.clipboard.writeText(group.invite_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleMarkInactive = async (membershipId) => {
    setUpdating(membershipId)
    try {
      await api.patch(
        `/groups/${groupId}/members/${membershipId}/status/`,
        { status: 'inactive' }
      )
      setMembers(members.map(m =>
        m.id === membershipId ? { ...m, status: 'inactive' } : m
      ))
    } catch (err) {
      alert('Failed to update member status.')
    } finally {
      setUpdating(null)
    }
  }

  const handleMarkActive = async (membershipId) => {
    setUpdating(membershipId)
    try {
      await api.patch(
        `/groups/${groupId}/members/${membershipId}/status/`,
        { status: 'active' }
      )
      setMembers(members.map(m =>
        m.id === membershipId ? { ...m, status: 'active' } : m
      ))
    } catch (err) {
      alert('Failed to update member status.')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (membershipId) => {
    try {
      await api.delete(
        `/groups/${groupId}/members/${membershipId}/remove/`
      )
      setMembers(members.filter(m => m.id !== membershipId))
      setConfirmRemove(null)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.')
    }
  }

  if (loading) return <div className="loading">Loading members...</div>

  const activeMembers = members.filter(m => m.status === 'active')
  const inactiveMembers = members.filter(m => m.status === 'inactive')

  return (
    <DashboardLayout title="Group Members">
      <button
        className="back-btn"
        onClick={() => navigate(`/treasurer/groups/${groupId}`)}
      >
        ← Back to Group
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <div>
          <h1 className="dashboard-title">Group Members</h1>
          <p className="dashboard-subtitle">
            {activeMembers.length} active · {inactiveMembers.length} inactive
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopyInvite}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Copy size={14} />
          {copied ? 'Copied!' : 'Copy Invite Link'}
        </button>
      </div>

      {/* Confirm remove modal */}
      {confirmRemove && (
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
            maxWidth: '400px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{
              fontSize: '17px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '10px'
            }}>
              Remove Member
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Are you sure you want to permanently remove{' '}
              <strong>{confirmRemove.username}</strong> from this group?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => handleRemove(confirmRemove.id)}
              >
                Yes, Remove
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setConfirmRemove(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active members */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-card-header">
          Active Members ({activeMembers.length})
        </div>
        {activeMembers.length === 0 ? (
          <div className="empty-state">No active members.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeMembers.map((member) => (
                <tr key={member.id}>
                  <td style={{ fontWeight: '600' }}>
                    {member.first_name || member.last_name
                      ? `${member.first_name} ${member.last_name}`.trim()
                      : '—'}
                  </td>
                  <td>{member.username}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} color="var(--text-muted)" />
                      {member.email || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      {member.phone_number || '—'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(member.date_joined).toLocaleDateString()}
                  </td>
                  <td>
                    {member.role !== 'treasurer' && (
                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'var(--orange-100)',
                          color: 'var(--orange-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        disabled={updating === member.id}
                        onClick={() => handleMarkInactive(member.id)}
                      >
                        <UserX size={13} />
                        Mark Inactive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div className="table-card">
          <div className="table-card-header">
            Inactive Members ({inactiveMembers.length})
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inactiveMembers.map((member) => (
                <tr key={member.id}>
                  <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                    {member.first_name || member.last_name
                      ? `${member.first_name} ${member.last_name}`.trim()
                      : '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{member.username}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} color="var(--text-muted)" />
                      {member.email || '—'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      {member.phone_number || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: 'var(--green-100)',
                          color: '#2d5a35',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        disabled={updating === member.id}
                        onClick={() => handleMarkActive(member.id)}
                      >
                        Reactivate
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        onClick={() => setConfirmRemove(member)}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

export default TreasurerGroupMembers