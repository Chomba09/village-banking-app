import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'
import { Copy, Mail, Phone, UserX, Trash2, Crown, ShieldOff, AlertTriangle } from 'lucide-react'

function TreasurerGroupMembers() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [confirmChairperson, setConfirmChairperson] = useState(null) // { member, action: 'assign' | 'remove' }
  const [chairpersonMsg, setChairpersonMsg] = useState('')

  // Penalty modal state
  const [penaltyModal, setPenaltyModal] = useState(null)  // member object or null
  const [penaltyType, setPenaltyType] = useState('')
  const [penaltyLoanId, setPenaltyLoanId] = useState('')
  const [penaltyLoading, setPenaltyLoading] = useState(false)
  const [penaltyMsg, setPenaltyMsg] = useState('')
  const [penaltyError, setPenaltyError] = useState('')

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

  const handleAssignChairperson = async () => {
    if (!confirmChairperson) return
    setUpdating('chairperson')
    setChairpersonMsg('')
    try {
      await api.post(`/groups/${groupId}/assign-chairperson/`, {
        user_id: confirmChairperson.member.user_id
      })
      setChairpersonMsg(`${confirmChairperson.member.username} has been appointed chairperson. They will need to log out and back in for the change to take effect.`)
      // Refresh members to update badges
      const membersRes = await api.get(`/groups/${groupId}/members/`)
      setMembers(membersRes.data)
      const groupRes = await api.get(`/groups/${groupId}/`)
      setGroup(groupRes.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign chairperson.')
    } finally {
      setUpdating(null)
      setConfirmChairperson(null)
    }
  }

  const handleRemoveChairperson = async () => {
    if (!confirmChairperson) return
    setUpdating('chairperson')
    setChairpersonMsg('')
    try {
      await api.post(`/groups/${groupId}/remove-chairperson/`)
      setChairpersonMsg(`${confirmChairperson.member.username} has been removed as chairperson and reverted to a regular member.`)
      const membersRes = await api.get(`/groups/${groupId}/members/`)
      setMembers(membersRes.data)
      const groupRes = await api.get(`/groups/${groupId}/`)
      setGroup(groupRes.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove chairperson.')
    } finally {
      setUpdating(null)
      setConfirmChairperson(null)
    }
  }

  const openPenaltyModal = (member) => {
    setPenaltyModal(member)
    setPenaltyType('')
    setPenaltyLoanId('')
    setPenaltyError('')
    setPenaltyMsg('')
  }

  const closePenaltyModal = () => {
    setPenaltyModal(null)
    setPenaltyType('')
    setPenaltyLoanId('')
    setPenaltyError('')
  }

  const handleApplyPenalty = async () => {
    if (!penaltyType) {
      setPenaltyError('Please select a penalty type.')
      return
    }
    setPenaltyLoading(true)
    setPenaltyError('')
    try {
      const body = {
        member_id: penaltyModal.user_id,
        group_id: parseInt(groupId),
        penalty_type: penaltyType,
      }
      if ((penaltyType === 'late_loan' || penaltyType === 'default_loan') && penaltyLoanId) {
        body.loan_id = penaltyLoanId
      }
      await api.post('/loans/apply-penalty/', body)
      closePenaltyModal()
      setPenaltyMsg(`Penalty applied to ${penaltyModal.username} successfully.`)
      setTimeout(() => setPenaltyMsg(''), 5000)
    } catch (err) {
      setPenaltyError(err.response?.data?.error || 'Failed to apply penalty.')
    } finally {
      setPenaltyLoading(false)
    }
  }

  const penaltyTypeLabels = {
    late_loan: 'Late Loan Repayment',
    late_savings: 'Late Savings Contribution',
    no_savings: 'No Savings Contribution',
    default_loan: 'Loan Default',
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

      {/* Chairperson success message */}
      {chairpersonMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {chairpersonMsg}
          <button
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'inherit' }}
            onClick={() => setChairpersonMsg('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Penalty success message */}
      {penaltyMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {penaltyMsg}
          <button
            style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'inherit' }}
            onClick={() => setPenaltyMsg('')}
          >
            ×
          </button>
        </div>
      )}

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

      {/* Confirm chairperson action modal */}
      {confirmChairperson && (
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
            {confirmChairperson.action === 'assign' ? (
              <>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Appoint Chairperson
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.6' }}>
                  Are you sure you want to make <strong>{confirmChairperson.member.username}</strong> the chairperson of this group?
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
                  Any existing chairperson will be reverted to a regular member. The new chairperson will need to log out and back in for their dashboard to update.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed' }}
                    disabled={updating === 'chairperson'}
                    onClick={handleAssignChairperson}
                  >
                    {updating === 'chairperson' ? 'Appointing...' : 'Yes, Appoint'}
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmChairperson(null)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Remove Chairperson
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                  Are you sure you want to remove <strong>{confirmChairperson.member.username}</strong> as chairperson?
                  They will revert to a regular member role.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    disabled={updating === 'chairperson'}
                    onClick={handleRemoveChairperson}
                  >
                    {updating === 'chairperson' ? 'Removing...' : 'Yes, Remove'}
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmChairperson(null)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Apply Penalty modal */}
      {penaltyModal && (
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
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Apply Penalty
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              Charging a penalty to <strong>{penaltyModal.first_name || penaltyModal.username}</strong>.
              The amount will be deducted from the configured group penalty rates.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Penalty Type *
              </label>
              <select
                value={penaltyType}
                onChange={(e) => setPenaltyType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="">Select a penalty type…</option>
                {Object.entries(penaltyTypeLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {(penaltyType === 'late_loan' || penaltyType === 'default_loan') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Loan ID (optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  value={penaltyLoanId}
                  onChange={(e) => setPenaltyLoanId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  If provided, the loan number will be noted in the transaction record.
                </p>
              </div>
            )}

            {penaltyError && (
              <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '13px' }}>
                {penaltyError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={penaltyLoading}
                onClick={handleApplyPenalty}
              >
                {penaltyLoading ? 'Applying…' : 'Apply Penalty'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={closePenaltyModal}
                disabled={penaltyLoading}
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
                <th>Member ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeMembers.map((member) => (
                <tr key={member.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{member.member_id}</td>
                  <td style={{ fontWeight: '600' }}>
                    {member.first_name || member.last_name
                      ? `${member.first_name} ${member.last_name}`.trim()
                      : '—'}
                    {member.is_treasurer && (
                      <span className="badge badge-treasurer" style={{ marginLeft: '6px' }}>Treasurer</span>
                    )}
                    {member.is_chairperson && (
                      <span className="badge" style={{
                        marginLeft: '6px',
                        background: '#ede9fe',
                        color: '#6d28d9',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        Chairperson
                      </span>
                    )}
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
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {/* Mark inactive — not available for treasurer */}
                      {!member.is_treasurer && !member.is_chairperson && (
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

                      {/* Chairperson actions — not available for treasurer */}
                      {!member.is_treasurer && (
                        member.is_chairperson ? (
                          <button
                            className="btn btn-sm"
                            style={{
                              background: '#ede9fe',
                              color: '#6d28d9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onClick={() => setConfirmChairperson({ member, action: 'remove' })}
                          >
                            <ShieldOff size={13} />
                            Remove Chair
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{
                              background: '#f5f3ff',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onClick={() => setConfirmChairperson({ member, action: 'assign' })}
                          >
                            <Crown size={13} />
                            Make Chair
                          </button>
                        )
                      )}

                      {/* Apply Penalty — available for all non-treasurer members */}
                      {!member.is_treasurer && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: '#fef2f2',
                            color: '#b91c1c',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => openPenaltyModal(member)}
                        >
                          <AlertTriangle size={13} />
                          Penalty
                        </button>
                      )}
                    </div>
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
