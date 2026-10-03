import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function GlobalSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(query)
  const [results, setResults] = useState({ members: [], loans: [], transactions: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query) {
      setResults({ members: [], loans: [], transactions: [] })
      return
    }
    setLoading(true)
    setError('')
    api.get('/dashboard/search/', { params: { q: query } })
      .then(res => setResults(res.data))
      .catch(() => setError('Search failed. Please try again.'))
      .finally(() => setLoading(false))
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() })
    }
  }

  const totalResults = results.members.length + results.loans.length + results.transactions.length

  return (
    <DashboardLayout title="Search">
       <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent-primary)', fontSize: '14px',
          marginBottom: '16px', padding: '0', display: 'flex',
          alignItems: 'center', gap: '6px'
        }}
      >
        ← Back
      </button>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px', maxWidth: '480px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search members, loans, transactions..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Searching...</div>}

      {!loading && query && (
        <p className="dashboard-subtitle" style={{ marginBottom: '16px' }}>
          {totalResults} result{totalResults !== 1 ? 's' : ''} for "<strong>{query}</strong>"
        </p>
      )}

      {!loading && query && totalResults === 0 && (
        <div className="table-card">
          <div className="empty-state">No matches found. Try a name, member ID, phone number, or loan status.</div>
        </div>
      )}

      {results.members.length > 0 && (
        <div className="table-card" style={{ marginBottom: '20px' }}>
          <div className="table-card-header">Members ({results.members.length})</div>
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Group</th>
              </tr>
            </thead>
            <tbody>
              {results.members.map((m) => (
                <tr key={m.membership_id}>
                  <td>{m.member_id}</td>
                  <td>{m.full_name || '—'}</td>
                  <td>{m.username}</td>
                  <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                  <td>{m.group_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.loans.length > 0 && (
        <div className="table-card" style={{ marginBottom: '20px' }}>
          <div className="table-card-header">Loans ({results.loans.length})</div>
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Member</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.loans.map((l) => (
                <tr key={l.id}>
                  <td>{l.member_id}</td>
                  <td>{l.member_username}</td>
                  <td>{l.group_name}</td>
                  <td>K{Number(l.amount).toFixed(2)}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.transactions.length > 0 && (
        <div className="table-card">
          <div className="table-card-header">Transactions ({results.transactions.length})</div>
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Member</th>
                <th>Group</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.member_id}</td>
                  <td>{t.member_username}</td>
                  <td>{t.group_name}</td>
                  <td>{t.transaction_type}</td>
                  <td>K{Number(t.amount).toFixed(2)}</td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

export default GlobalSearch
