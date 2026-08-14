import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'

function MemberContributions() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    amount: '',
    note: '',
  })

  useEffect(() => {
    fetchContributions()
  }, [groupId])

  const fetchContributions = async () => {
    try {
      const response = await api.get('/contributions/my/')
      const filtered = response.data.filter(
        c => String(c.group) === String(groupId)
      )
      setContributions(filtered)
    } catch (err) {
      setError('Failed to load contributions.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/contributions/make/', {
        group: groupId,
        amount: formData.amount,
        note: formData.note,
      })
      setSuccess('Contribution submitted successfully! Waiting for treasurer confirmation.')
      setFormData({ amount: '', note: '' })
      setShowForm(false)
      fetchContributions()
    } catch (err) {
      setError('Failed to submit contribution. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading contributions...</div>

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <button
          onClick={() => navigate('/member/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a56db', fontSize: '14px', marginBottom: '4px' }}
        >
          ← Back to Dashboard
        </button>

        <h1 className="dashboard-title">My Contributions</h1>
        <p className="dashboard-subtitle">View your contribution history and make new contributions.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button
          className="btn btn-primary"
          style={{ width: 'auto', padding: '10px 20px', marginBottom: '20px' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Make a Contribution'}
        </button>

        {showForm && (
          <div className="table-card" style={{ padding: '24px', maxWidth: '400px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>New Contribution</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Amount (K)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g. Monthly contribution for August"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </form>
          </div>
        )}

        {contributions.length === 0 ? (
          <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No contributions yet. Make your first contribution above.
          </div>
        ) : (
          <div className="table-card">
            <div className="table-card-header">
              My Contribution History ({contributions.length})
            </div>
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>K{Number(contribution.amount).toFixed(2)}</td>
                    <td>{contribution.date}</td>
                    <td>{contribution.note || '—'}</td>
                    <td>
                      <span className={`badge badge-${contribution.status}`}>
                        {contribution.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemberContributions