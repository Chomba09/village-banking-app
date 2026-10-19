import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../api/axios'

function CycleReport() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

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

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      // Load jsPDF from CDN dynamically — no npm install needed
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')

      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      const pageW = doc.internal.pageSize.getWidth()
      const margin = 14

      // ── Header ──
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('VILLAGE BANKING GROUP — CYCLE FINANCIAL REPORT', pageW / 2, 16, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(report.group_name, pageW / 2, 23, { align: 'center' })
      doc.text(
        `${report.cycle_name}  |  ${report.start_date} to ${report.end_date}  |  Interest Rate: ${report.interest_rate}%`,
        pageW / 2, 29, { align: 'center' }
      )
      doc.text(
        `Generated: ${new Date(report.generated_at).toLocaleString()}`,
        pageW / 2, 35, { align: 'center' }
      )

      // ── Summary row ──
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      const summaryY = 42
      const summaryItems = [
        ['Total Savings', fmt(report.group_totals.total_savings)],
        ['Total Loans Issued', fmt(report.group_totals.total_borrowed)],
        ['Total Interest Earned', fmt(report.group_totals.total_interest_charged)],
        ['Total Repaid', fmt(report.group_totals.total_repaid)],
        ['Total Outstanding', fmt(report.group_totals.total_outstanding)],
        ['Total Payout', fmt(report.group_totals.total_payout)],
        ['Penalties Collected', fmt(report.group_totals.total_penalties_collected || 0)],
        ['Undistributed', fmt(report.group_totals.undistributed_interest || 0)],
      ]
      const colW = (pageW - margin * 2) / summaryItems.length
      summaryItems.forEach(([label, value], i) => {
        const x = margin + i * colW + colW / 2
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(label, x, summaryY, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(value, x, summaryY + 6, { align: 'center' })
      })

      // ── Main table ──
      const tableHead = [
        ['#', 'Member', 'Total\nSavings', 'Loan\nTaken', 'Interest\nCharged',
         'Loan\nPayable', 'Total\nRepaid', 'Outstanding\nBalance',
         'Eligible\nAmount', 'Income\nShare', 'Final\nPayout']
      ]

      const tableBody = report.member_reports.map((m, i) => [
        i + 1,
        m.full_name + (m.submitted_by_treasurer ? '\n(Treasurer)' : ''),
        fmt(m.total_savings),
        fmt(m.total_borrowed),
        fmt(m.interest_charged),
        fmt(m.loan_amount_payable),
        fmt(m.total_repaid),
        Number(m.outstanding_balance) > 0 ? fmt(m.outstanding_balance) : '—',
        fmt(m.eligible_amount),
        fmt(m.interest_earned_share),
        fmt(m.final_payout),
      ])

      // Totals row
      const gt = report.group_totals
      tableBody.push([
        '', 'TOTALS',
        fmt(gt.total_savings), fmt(gt.total_borrowed),
        fmt(gt.total_interest_charged), fmt(gt.total_loan_payable),
        fmt(gt.total_repaid), fmt(gt.total_outstanding),
        fmt(gt.total_eligible), fmt(gt.total_interest_shared),
        fmt(gt.total_payout),
      ])

      doc.autoTable({
        head: tableHead,
        body: tableBody,
        startY: summaryY + 14,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
        headStyles: {
          fillColor: [91, 33, 182],  // purple
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { halign: 'left', cellWidth: 30 },
        },
        didParseCell(data) {
          // Highlight totals row
          if (data.row.index === tableBody.length - 1) {
            data.cell.styles.fillColor = [240, 234, 255]
            data.cell.styles.fontStyle = 'bold'
          }
          // Highlight outstanding balance in red if > 0
          if (data.column.index === 7 && data.row.index < tableBody.length - 1) {
            const val = report.member_reports[data.row.index]?.outstanding_balance
            if (val && Number(val) > 0) {
              data.cell.styles.textColor = [185, 28, 28]
              data.cell.styles.fontStyle = 'bold'
            }
          }
          // Highlight final payout column
          if (data.column.index === 10) {
            data.cell.styles.textColor = [91, 33, 182]
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })

      // ── Footer notes ──
      const finalY = doc.lastAutoTable.finalY + 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100)
      const notes = [
        'Eligible Amount = Total savings × 2 (maximum loan a member can request)',
        'Income Share = (Member savings ÷ Total group savings) × (Interest earned + Penalties collected), rounded down to whole kwacha',
        'Final Payout = Total savings + Income share (amount member receives at end of cycle)',
        'Members with outstanding balances must clear them before the next cycle begins',
      ]
      notes.forEach((note, i) => {
        doc.text(`• ${note}`, margin, finalY + i * 4.5)
      })

      // ── Page numbers ──
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Page ${i} of ${pageCount}  —  ${report.group_name}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        )
      }

      // ── Save ──
      const filename = `${report.group_name.replace(/\s+/g, '_')}_${report.cycle_name.replace(/\s+/g, '_')}_Report.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Please check your internet connection and try again.')
    } finally {
      setExporting(false)
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  if (loading) return <div className="loading">Generating report...</div>
  if (error) return <div className="alert alert-error">{error}</div>

  const { member_reports, group_totals } = report

  return (
    <DashboardLayout title="Cycle Report">
      <button className="back-btn" onClick={() => navigate(backPath)}>
        ← Back to Group
      </button>

      {/* Report header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="dashboard-title">{report.group_name}</h1>
          <p className="dashboard-subtitle">
            Financial Report — {report.cycle_name} &nbsp;|&nbsp;
            {report.start_date} to {report.end_date} &nbsp;|&nbsp;
            Interest Rate: {report.interest_rate}% &nbsp;|&nbsp;
            Generated: {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
            background: exporting ? 'var(--text-muted)' : '#16a34a',
            color: 'white', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap'
          }}
        >
          <Download size={16} />
          {exporting ? 'Generating PDF...' : 'Download PDF'}
        </button>
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
          { label: 'Penalties Collected', value: fmt(group_totals.total_penalties_collected || 0) },
          { label: 'Undistributed', value: fmt(group_totals.undistributed_interest || 0) },
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
              <th>Income Share</th>
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
        • <strong>Group income</strong> = Interest earned on loans + Penalties members have paid<br />
        • <strong>Income Share</strong> = (Member savings ÷ Total group savings) × Group income, rounded down to whole kwacha so it can be paid out in cash<br />
        • <strong>Undistributed</strong> = the few kwacha left over from rounding down; it stays in the group fund<br />
        • <strong>Final Payout</strong> = Total savings + Income share (amount member receives at end of cycle)<br />
        • Members highlighted in purple are treasurer contributions/loans<br />
        • Members with outstanding balances must clear them before contributing to the next cycle
      </div>
    </DashboardLayout>
  )
}

export default CycleReport
