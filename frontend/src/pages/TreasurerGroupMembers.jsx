import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Copy, Mail, Phone } from 'lucide-react'

function TreasurerGroupMembers() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
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
    fetchData()
  }, [groupId])

  const handleCopyInvite = () => {
    if (group?.invite_link) {
      navigator.clipboard.writeText(group.invite_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (loading) return <div className="loading">Loading members...</div>

  return (
    <DashboardLayout title="Group Members">
      <button className="back-btn" onClick={() => navigate(`/treasurer/groups/${groupId}`)}>
        ← Back to Group
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div>
          <h1 className="dashboard-title">Group Members</h1>
          <p className="dashboard-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} in this group</p>
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

      <div className="table-card">
        {members.length === 0 ? (
          <div className="empty-state">No members yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
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
                  <td>
                    <span className={`badge badge-${member.role === 'treasurer' ? 'approved' : 'contribution'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${member.status}`}>
                      {member.status}
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
    </DashboardLayout>
  )
}

export default TreasurerGroupMembers