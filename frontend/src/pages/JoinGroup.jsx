import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function JoinGroup() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('joining')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const joinGroup = async () => {
        const accessToken = localStorage.getItem('access_token')
        if (!accessToken) {
        localStorage.setItem('pending_invite', token)
        navigate('/login')
        return
        }
        try {
        const response = await api.get(`/groups/join/${token}/`)
        setMessage(response.data.message)
        setStatus('success')
        } catch (err) {
        setMessage(err.response?.data?.error || 'Invalid or expired invite link.')
        setStatus('error')
        }
    }
    joinGroup()
   }, [token])

   useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
   }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--border-color)'
      }}>
       <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            {status === 'joining' && <Loader2 size={48} color="var(--accent-primary)" strokeWidth={1.5} />}
            {status === 'success' && <CheckCircle2 size={48} color="var(--green-500)" strokeWidth={1.5} />}
            {status === 'error' && <XCircle size={48} color="#b91c1c" strokeWidth={1.5} />}
        </div>

        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '12px'
        }}>
          {status === 'joining' && 'Joining group...'}
          {status === 'success' && 'Successfully Joined!'}
          {status === 'error' && 'Could not join group'}
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '28px',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        {status !== 'joining' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/member/dashboard')}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  )
}

export default JoinGroup