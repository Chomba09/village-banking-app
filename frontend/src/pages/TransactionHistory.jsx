import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      const params = filter ? `?type=${filter}` : ''
      const response = await api.get(`/transactions/${params}`)
      setTransactions(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading transactions...</div>

  return (
    <DashboardLayout title="Transaction History">
      <h1 className="dashboard-title">Transaction History</h1>
      <p className="dashboard-subtitle">A full log of all your financial activity.</p>

      <div style={{ marginBottom: '16px' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 14px',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
          }}
        >
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="contribution">Contribution</option>
          <option value="loan_disbursement">Loan Disbursement</option>
          <option value="loan_repayment">Loan Repayment</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          All Transactions ({transactions.length})
        </div>
        {transactions.length === 0 ? (
          <div className="empty-state">No transactions found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${tx.transaction_type}`}>
                      {tx.transaction_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{tx.group_name}</td>
                  <td>K{Number(tx.amount).toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${tx.status}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>{tx.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TransactionHistory