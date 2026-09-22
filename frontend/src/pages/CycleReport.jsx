import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function CycleReport() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/dashboard/group/${groupId}/cycle-report/`)
      .then(res => setReport(res.data))
      .catch(() => setError('Failed to load cycle report.'))
      .finally(() => setLoading(false))
  }, [groupId])

  const backPath = role === 'treasurer'
    ? `/treasurer/groups/${groupId}`
    : `/member/groups/${groupId}`

  const fmt = (val) => `K${Number(val).toFixed(2)}`

  if (loading) return <div className="loading">Generating report...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const { member_reports, group_totals } = report

  return (
    <DashboardLayout title="Cycle Report">
      <button className="back-btn" onClick={() => navigate(backPath)}>
        ← Back to Group
      </button>

      {/* Report header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="dashboard-title">{report.group_name}</h1>
        <p className="dashboard-subtitle">
          Financial Report — {report.cycle_name} &nbsp;|&nbsp;
          {report.start_date} to {report.end_date} &nbsp;|&nbsp;
          Interest Rate: {report.interest_rate}% &nbsp;|&nbsp;
          Generated: {new Date(report.generated_at).toLocaleString()}
        </p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Group Savings', value: fmt(group_totals.total_savings) },
          { label: 'Total Loans Issued', value: fmt(group_totals.total_borrowed) },
          { label: 'Total Interest Earned', value: fmt(group_totals.total_interest_charged) },
          { label: 'Total Repaid', value: fmt(group_totals.total_repaid) },
          { label: 'Total Outstanding', value: fmt(group_totals.total_outstanding) },
          { label: 'Total Payout', value: fmt(group_totals.total_payout) },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-card-title">{item.label}</div>
            <div className="stat-card-value" style={{ fontSize: '18px' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main report table */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        <div className="table-card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Member Financial Report — {report.cycle_name}</span>
        </div>

        <table style={{ minWidth: '1100px' }}>
          <thead>
            <tr>
              <th style={{ width: '30px' }}>#</th>
              <th>Member</th>
              <th>Total Savings</th>
              <th>Loan Taken</th>
              <th>Interest</th>
              <th>Loan Payable</th>
              <th>Repayments</th>
              <th>Outstanding</th>
              <th>Eligible Amount</th>
              <th>Interest Share</th>
              <th>Final Payout</th>
            </tr>
          </thead>
          <tbody>
            {member_reports.map((member, index) => (
              <tr key={member.member_id} style={{
                background: member.submitted_by_treasurer
                  ? 'var(--purple-100)'
                  : 'transparent'
              }}>
                <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {index + 1}
                </td>
                <td>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {member.full_name}
                  </div>
                  {member.submitted_by_treasurer && (
                    <span style={{
                      fontSize: '10px',
                      background: 'var(--purple-700)',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      Treasurer
                    </span>
                  )}
                </td>
                <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                  {fmt(member.total_savings)}
                </td>
                <td>{fmt(member.total_borrowed)}</td>
                <td style={{ color: 'var(--crimson-500)' }}>
                  {fmt(member.interest_charged)}
                </td>
                <td>{fmt(member.loan_amount_payable)}</td>
                <td style={{ color: '#4a8c55' }}>
                  {fmt(member.total_repaid)}
                </td>
                <td style={{
                  color: Number(member.outstanding_balance) > 0
                    ? 'var(--crimson-500)'
                    : 'var(--text-muted)',
                  fontWeight: Number(member.outstanding_balance) > 0 ? '700' : '400'
                }}>
                  {Number(member.outstanding_balance) > 0
                    ? fmt(member.outstanding_balance)
                    : '—'}
                </td>
                <td>{fmt(member.eligible_amount)}</td>
                <td style={{ color: 'var(--accent-secondary)' }}>
                  {fmt(member.interest_earned_share)}
                </td>
                <td style={{
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  fontSize: '15px'
                }}>
                  {fmt(member.final_payout)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{
              background: 'var(--bg-primary)',
              fontWeight: '700',
              borderTop: '2px solid var(--border-strong)'
            }}>
              <td colSpan={2} style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                TOTALS
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--accent-primary)' }}>
                {fmt(group_totals.total_savings)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {fmt(group_totals.total_borrowed)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--crimson-500)' }}>
                {fmt(group_totals.total_interest_charged)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {fmt(group_totals.total_loan_payable)}
              </td>
              <td style={{ padding: '12px 16px', color: '#4a8c55' }}>
                {fmt(group_totals.total_repaid)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--crimson-500)' }}>
                {fmt(group_totals.total_outstanding)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {fmt(group_totals.total_eligible)}
              </td>
              <td style={{ padding: '12px 16px', color: 'var(--accent-secondary)' }}>
                {fmt(group_totals.total_interest_shared)}
              </td>
              <td style={{
                padding: '12px 16px',
                color: 'var(--accent-primary)',
                fontSize: '15px'
              }}>
                {fmt(group_totals.total_payout)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      <div style={{
        marginTop: '16px',
        padding: '16px 20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        lineHeight: '1.8'
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Notes:</strong><br />
        • <strong>Eligible Amount</strong> = Total savings × 2 (maximum loan a member can request)<br />
        • <strong>Interest Share</strong> = (Member savings ÷ Total group savings) × Total interest earned<br />
        • <strong>Final Payout</strong> = Total savings + Interest share (amount member receives at end of cycle)<br />
        • Members highlighted in purple are treasurer contributions/loans<br />
        • Members with outstanding balances must clear them before contributing to the next cycle
      </div>
    </DashboardLayout>
  )
}

export default CycleReport