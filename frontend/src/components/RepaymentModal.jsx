import { useState, useEffect } from 'react'
import { X, CreditCard } from 'lucide-react'
import api from '../api/axios'

function RepaymentModal({ loan, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const balance = Number(loan.balance_remaining)
  const enteredAmount = Number(amount)
  const isValid = amount !== '' && enteredAmount > 0
  const exceedsBalance = isValid && enteredAmount > balance

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isValid) { setError('Please enter a repayment amount greater than zero.'); return }
    if (exceedsBalance) { setError(`Amount cannot exceed your remaining balance of K${balance.toFixed(2)}.`); return }
    setSubmitting(true)
    try {
      await api.post('/loans/repay/', { loan: loan.id, amount: enteredAmount, note: note.trim() || undefined })
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      setError(data?.non_field_errors?.[0] || data?.amount?.[0] || data?.detail || 'Failed to submit repayment. Please try again.')
    } finally { setSubmitting(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      <div role="dialog" aria-modal="true" style={{
        position: 'fixed', zIndex: 1001, top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '420px',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Make a Repayment</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { label: 'Total Due', value: `K${Number(loan.total_due).toFixed(2)}` },
            { label: 'Already Repaid', value: `K${Number(loan.total_repaid).toFixed(2)}` },
            { label: 'Balance Remaining', value: `K${balance.toFixed(2)}`, highlight: true },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 14px', background: 'var(--bg-card)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: item.highlight ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Repayment Amount (K)</label>
              <button type="button" onClick={() => { setAmount(balance.toFixed(2)); setError('') }}
                style={{ background: 'none', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '6px', padding: '2px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                Pay in full
              </button>
            </div>
            <input type="number" min="0.01" step="0.01" max={balance} placeholder={`Enter amount (max K${balance.toFixed(2)})`}
              value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} autoFocus
              style={{ borderColor: exceedsBalance ? '#b91c1c' : undefined }} />
            {exceedsBalance && <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>Amount exceeds your remaining balance of K{balance.toFixed(2)}.</p>}
          </div>
          <div className="form-group">
            <label>Note <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span></label>
            <input type="text" placeholder="e.g. First instalment" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancel</button>
            <button type="submit" disabled={submitting || !isValid || exceedsBalance}
              style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-sm)', background: submitting || !isValid || exceedsBalance ? 'var(--text-muted)' : 'var(--accent-primary)', border: 'none', color: 'white', cursor: submitting || !isValid || exceedsBalance ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px' }}>
              {submitting ? 'Processing...' : 'Confirm Repayment'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default RepaymentModal
