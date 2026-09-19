import type { ReportsData } from '@/features/reports'
import { formatCurrency } from './reportHelpers'

// ─── CSV Export ────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvRow(cells: (string | number | undefined)[]): string {
  return cells.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
}

export function exportOverviewToCsv(data: ReportsData): void {
  const { overview } = data
  const rows = [
    csvRow(['Metric', 'Value']),
    csvRow(['Total Revenue', formatCurrency(overview.total_revenue)]),
    csvRow(['Total Expenses', formatCurrency(overview.total_expenses)]),
    csvRow(['Net Profit', formatCurrency(overview.net_profit)]),
    csvRow(['Profit Margin', overview.profit_margin + '%']),
    csvRow(['Transaction Volume', formatCurrency(overview.transaction_volume)]),
    csvRow(['Transaction Count', overview.transaction_count]),
    csvRow(['Total Deposits', formatCurrency(overview.total_deposits)]),
    csvRow(['Total Loans Outstanding', formatCurrency(overview.total_loan_outstanding)]),
  ]
  downloadFile(rows.join('\n'), 'bankvision-overview-report.csv', 'text/csv;charset=utf-8;')
}

export function exportTransactionsToCsv(data: ReportsData): void {
  const { transaction_analytics } = data
  const rows = [
    '--- Transaction Volume by Type ---',
    csvRow(['Type', 'Count', 'Total Amount']),
    ...transaction_analytics.by_type.map(t =>
      csvRow([t.name, t.count, formatCurrency(t.total_amount)])
    ),
    '',
    '--- Transaction Volume by Channel ---',
    csvRow(['Channel', 'Count', 'Total Amount']),
    ...transaction_analytics.by_channel.map(c =>
      csvRow([c.name, c.count, formatCurrency(c.total_amount)])
    ),
    '',
    '--- High-Value Transactions ---',
    csvRow(['Transaction #', 'Type', 'Amount', 'Channel', 'Status', 'Customer', 'Date']),
    ...transaction_analytics.high_value_transactions.map(t =>
      csvRow([t.transaction_number, t.type, formatCurrency(t.amount), t.channel, t.status, t.customer_name ?? '', t.date])
    ),
  ]
  downloadFile(rows.join('\n'), 'bankvision-transactions-report.csv', 'text/csv;charset=utf-8;')
}

export function exportLoansToCsv(data: ReportsData): void {
  const { loan_analytics } = data
  const ps = loan_analytics.portfolio_summary
  const rows = [
    '--- Loan Portfolio Summary ---',
    csvRow(['Metric', 'Value']),
    csvRow(['Total Loans', ps.total_loans]),
    csvRow(['Active Loans', ps.active_loans]),
    csvRow(['Total Principal', formatCurrency(ps.total_principal)]),
    csvRow(['Total Outstanding', formatCurrency(ps.total_outstanding)]),
    csvRow(['Avg Interest Rate', ps.avg_interest_rate + '%']),
    csvRow(['NPL Ratio', ps.npl_ratio + '%']),
    csvRow(['Delinquency Rate', ps.delinquency_rate + '%']),
    '',
    '--- Loan Performance by Type ---',
    csvRow(['Type', 'Count', 'Total Principal', 'Total Outstanding', 'Avg Rate']),
    ...loan_analytics.by_type.map(l =>
      csvRow([l.loan_type, l.count, formatCurrency(l.total_principal), formatCurrency(l.total_outstanding), l.avg_rate + '%'])
    ),
    '',
    '--- Status Breakdown ---',
    csvRow(['Status', 'Count']),
    csvRow(['Approved', loan_analytics.status_breakdown.approved]),
    csvRow(['Pending', loan_analytics.status_breakdown.pending]),
    csvRow(['Rejected', loan_analytics.status_breakdown.rejected]),
    csvRow(['Delinquent', loan_analytics.status_breakdown.delinquent]),
    csvRow(['Defaulted', loan_analytics.status_breakdown.defaulted]),
  ]
  downloadFile(rows.join('\n'), 'bankvision-loans-report.csv', 'text/csv;charset=utf-8;')
}

export function exportRiskToCsv(data: ReportsData): void {
  const { risk_compliance } = data
  const rows = [
    '--- Customer Risk Distribution ---',
    csvRow(['Risk Level', 'Count', 'Percentage']),
    csvRow(['High Risk', risk_compliance.customer_risk.high_risk, risk_compliance.customer_risk.high_pct + '%']),
    csvRow(['Medium Risk', risk_compliance.customer_risk.medium_risk, risk_compliance.customer_risk.medium_pct + '%']),
    csvRow(['Low Risk', risk_compliance.customer_risk.low_risk, risk_compliance.customer_risk.low_pct + '%']),
    '',
    '--- KYC Status ---',
    csvRow(['Status', 'Count']),
    csvRow(['Verified', risk_compliance.kyc_status.verified]),
    csvRow(['Pending', risk_compliance.kyc_status.pending]),
    csvRow(['Expired', risk_compliance.kyc_status.expired]),
    csvRow(['Rejected', risk_compliance.kyc_status.rejected]),
    '',
    '--- AML Alerts ---',
    csvRow(['Status', 'Count']),
    csvRow(['Open', risk_compliance.aml_alerts.open]),
    csvRow(['Resolved', risk_compliance.aml_alerts.resolved]),
    csvRow(['Critical Open', risk_compliance.aml_alerts.critical]),
    '',
    '--- Branch Risk Breakdown ---',
    csvRow(['Branch', 'Total Customers', 'High Risk', 'Medium Risk', 'High Risk %']),
    ...risk_compliance.branch_risk.map(b =>
      csvRow([b.branch_name, b.total_customers, b.high_risk_count, b.medium_risk_count, b.high_risk_percentage + '%'])
    ),
  ]
  downloadFile(rows.join('\n'), 'bankvision-risk-compliance-report.csv', 'text/csv;charset=utf-8;')
}


export function exportFullReportToCsv(data: ReportsData): void {
  const sections: string[] = []
  sections.push('BankVision — Full Analytics Report')
  sections.push('Generated: ' + new Date().toLocaleString())
  sections.push('')
  sections.push('=== OVERVIEW ===')
  sections.push(csvRow(['Total Revenue', formatCurrency(data.overview.total_revenue)]))
  sections.push(csvRow(['Total Expenses', formatCurrency(data.overview.total_expenses)]))
  sections.push(csvRow(['Net Profit', formatCurrency(data.overview.net_profit)]))
  sections.push('')
  sections.push('=== TRANSACTIONS ===')
  sections.push(csvRow(['Type', 'Count', 'Total Amount']))
  data.transaction_analytics.by_type.forEach(t =>
    sections.push(csvRow([t.name, t.count, formatCurrency(t.total_amount)]))
  )
  downloadFile(sections.join('\n'), 'bankvision-full-report.csv', 'text/csv;charset=utf-8;')
}

// ─── PDF Print Export ─────────────────────────────────────────────────────────

export function exportReportToPdf(): void {
  window.print()
}

// ─── Excel (simplified CSV with .xlsx extension for Excel) ────────────────────

export function exportToExcel(data: ReportsData, sheetName = 'overview'): void {
  const excelHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${sheetName}">
    <Table>
`
  const excelFooter = `    </Table>
  </Worksheet>
</Workbook>`

  function row(cells: (string | number)[]): string {
    return `      <Row>${cells.map(c => `<Cell><Data ss:Type="${typeof c === 'number' ? 'Number' : 'String'}">${c}</Data></Cell>`).join('')}</Row>\n`
  }

  const { overview } = data
  const rows = [
    row(['Metric', 'Value']),
    row(['Total Revenue', overview.total_revenue]),
    row(['Total Expenses', overview.total_expenses]),
    row(['Net Profit', overview.net_profit]),
    row(['Profit Margin %', overview.profit_margin]),
    row(['Transaction Volume', overview.transaction_volume]),
    row(['Transaction Count', overview.transaction_count]),
    row(['Total Deposits', overview.total_deposits]),
    row(['Loan Outstanding', overview.total_loan_outstanding]),
  ]

  const content = excelHeader + rows.join('') + excelFooter
  downloadFile(content, 'bankvision-report.xls', 'application/vnd.ms-excel')
}
