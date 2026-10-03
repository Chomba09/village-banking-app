import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Users, PiggyBank, TrendingUp, Calendar } from 'lucide-react'
import api from '../api/axios'

function JoinGroup() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [stage, setStage] = useState('loading') // loading | preview | joining | success | error | already
  const [group, setGroup] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    const loadPreview = async () => {
      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        localStorage.setItem('pending_invite', token)
        navigate(`/login?next=/join/${token}`)
        return
      }
      try {
        const res = await api.get(`/groups/join/${token}/`)
        if (res.data.already_member) {
          setStage('already')
          setMessage(`You are already a member of ${res.data.name}.`)
        } else {
          setGroup(res.data)
          setStage('preview')
        }
      } catch (err) {
        setMessage(err.response?.data?.error || 'This invite link is invalid or has expired.')
        setStage('error')
      }
    }
    loadPreview()
  }, [token])

  const handleJoin = async () => {
    setStage('joining')
    try {
      const res = await api.post(`/groups/join/${token}/`)
      setMessage(res.data.message)
      setStage('success')
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.')
      setStage('error')
    }
  }

  const card = {
    background: 'var(--bg-card)',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    maxWidth: '460px',
    width: '100%',
    border: '1px solid var(--border-color)',
  }

  const wrap = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '20px',
  }

  if (stage === 'loading') {
    return (
      <div style={wrap}>
        <div style={{ ...card, textAlign: 'center' }}>
          <Loader2 size={48} color="var(--accent-primary)" strokeWidth={1.5}
            style={{ marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading group details...</p>
        </div>
      </div>
    )
  }

  if (stage === 'preview' && group) {
    return (
      <div style={wrap}>
        <div style={card}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--accent-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <PiggyBank size={28} color="white" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              You have been invited to join
            </h2>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '6px' }}>
              {group.name}
            </h1>
            {group.description && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {group.description}
              </p>
            )}
          </div>

          {/* Group info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              padding: '14px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Members</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {group.member_count}{group.maximum_members ? ` / ${group.maximum_members}` : ''}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              padding: '14px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <PiggyBank size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Min. Contribution</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                K{Number(group.minimum_contribution).toFixed(0)}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              padding: '14px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <TrendingUp size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Interest Rate</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {group.interest_rate}%
              </div>
            </div>

            <div style={{
              background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              padding: '14px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calendar size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Cycle Ends</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {group.cycle_end_date ? new Date(group.cycle_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
            Managed by <strong>{group.treasurer}</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px' }} onClick={handleJoin}>
              Join {group.name}
            </button>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: '4px' }}
              onClick={() => navigate('/member/dashboard')}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // joining / success / error / already states
  const icon = {
    joining: <Loader2 size={48} color="var(--accent-primary)" strokeWidth={1.5} />,
    success: <CheckCircle2 size={48} color="var(--green-500, #16a34a)" strokeWidth={1.5} />,
    error: <XCircle size={48} color="#b91c1c" strokeWidth={1.5} />,
    already: <CheckCircle2 size={48} color="var(--accent-primary)" strokeWidth={1.5} />,
  }

  const heading = {
    joining: 'Joining group...',
    success: 'You\'re in!',
    error: 'Could not join group',
    already: 'Already a member',
  }

  return (
    <div style={wrap}>
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          {icon[stage]}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
          {heading[stage]}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
          {message}
        </p>
        {stage !== 'joining' && (
          <button className="btn btn-primary" onClick={() => navigate('/member/dashboard')}>
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  )
}

export default JoinGroup
