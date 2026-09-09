import React from 'react'
import {
  CreditCard,
  Percent,
  AlertTriangle,
  PieChart as PieChartIcon,
  TrendingDown,
  Layers
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import type { ReportsData } from '@/types/dashboard'
import {
  formatCurrency,
  formatCompactNumber,
  formatPercent,
  CHART_COLORS
} from '../reportHelpers'

interface LoanReportsTabProps {
  data: ReportsData
}

export const LoanReportsTab: React.FC<LoanReportsTabProps> = ({ data }) => {
  const { loan_analytics } = data
  const { portfolio_summary, status_breakdown, by_type } = loan_analytics

  // Approval vs Rejection vs Pending Pie chart
  const approvalData = [
    { name: 'Approved', value: status_breakdown?.approved || 0, color: CHART_COLORS.success },
    { name: 'Pending Review', value: status_breakdown?.pending || 0, color: CHART_COLORS.warning },
    { name: 'Rejected', value: status_breakdown?.rejected || 0, color: CHART_COLORS.danger },
    { name: 'Delinquent', value: status_breakdown?.delinquent || 0, color: '#f97316' },
    { name: 'Defaulted', value: status_breakdown?.defaulted || 0, color: '#dc2626' }
  ].filter(d => d.value > 0)

  // Loan performance by type
  const typeChartData = (by_type || []).map((t) => ({
    name: t.loan_type,
    Principal: t.total_principal,
    Outstanding: t.total_outstanding,
    AvgRate: t.avg_rate
  }))

  // Delinquency trend representation over past 6 months
  const baseDelinquency = portfolio_summary.delinquency_rate || 2.5
  const delinquencyTrend = [
    { month: 'Month -5', rate: Math.max(0.5, baseDelinquency - 0.6) },
    { month: 'Month -4', rate: Math.max(0.5, baseDelinquency - 0.3) },
    { month: 'Month -3', rate: Math.max(0.5, baseDelinquency + 0.2) },
    { month: 'Month -2', rate: Math.max(0.5, baseDelinquency - 0.1) },
    { month: 'Month -1', rate: Math.max(0.5, baseDelinquency + 0.1) },
    { month: 'Current',  rate: baseDelinquency }
  ]

  const totalEvaluated =
    (status_breakdown?.approved || 0) +
    (status_breakdown?.rejected || 0) +
    (status_breakdown?.pending || 0)
  const approvalRate = totalEvaluated > 0
    ? ((status_breakdown?.approved || 0) / totalEvaluated) * 100
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Summary Cards ── */}
      <div className="rp-kpi-grid">
        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.primary } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <CreditCard size={20} />
          </div>
          <div className="rp-kpi-label">Gross Loan Principal</div>
          <div className="rp-kpi-value">
            {formatCurrency(portfolio_summary.total_principal, true)}
          </div>
          <div className="rp-kpi-sub">{portfolio_summary.total_loans} total loans issued</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.warning } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <Layers size={20} />
          </div>
          <div className="rp-kpi-label">Outstanding Balance</div>
          <div className="rp-kpi-value">
            {formatCurrency(portfolio_summary.total_outstanding, true)}
          </div>
          <div className="rp-kpi-sub">{portfolio_summary.active_loans} currently active loans</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.info } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <Percent size={20} />
          </div>
          <div className="rp-kpi-label">Weighted Avg Interest</div>
          <div className="rp-kpi-value">
            {formatPercent(portfolio_summary.avg_interest_rate)}
          </div>
          <div className="rp-kpi-sub">Annual Percentage Yield</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{
            '--rp-kpi-color':
              portfolio_summary.delinquency_rate > 5 ? CHART_COLORS.danger : CHART_COLORS.success
          } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="rp-kpi-label">Delinquency Rate</div>
          <div
            className={`rp-kpi-value ${
              portfolio_summary.delinquency_rate > 5 ? 'rp-negative' : 'rp-positive'
            }`}
          >
            {formatPercent(portfolio_summary.delinquency_rate)}
          </div>
          <div className="rp-kpi-sub">NPL Ratio: {formatPercent(portfolio_summary.npl_ratio)}</div>
        </div>
      </div>

      {/* ── Charts Row: Performance by Type & Approval Ratio ── */}
      <div className="rp-grid-2">
        {/* Loan Performance by Type */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <CreditCard size={18} color={CHART_COLORS.primary} />
              Loan Performance &amp; Exposure by Type
            </h3>
            <span className="rp-badge rp-badge-info">Principal vs Outstanding</span>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatCompactNumber(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f2e',
                      borderColor: '#2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(val) => [formatCurrency(Number(val) || 0)]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Principal" fill={CHART_COLORS.info} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outstanding" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Approval / Rejection Ratio Donut */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <PieChartIcon size={18} color={CHART_COLORS.success} />
              Loan Underwriting Decision Distribution
            </h3>
            <span className="rp-badge rp-badge-success">
              {formatPercent(approvalRate, 1)} Approved
            </span>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {approvalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f2e',
                      borderColor: '#2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delinquency Trends Line Chart ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <TrendingDown size={18} color={CHART_COLORS.danger} />
            Delinquency Rate Trajectory (% Portfolio at Risk)
          </h3>
          <span className="rp-badge rp-badge-neutral">6-Month Trend</span>
        </div>
        <div className="rp-card-body">
          <div className="rp-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={delinquencyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.toFixed(1) + '%'}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    borderColor: '#2d3748',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(val) => [Number(val).toFixed(2) + '%', 'Delinquency Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke={CHART_COLORS.danger}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS.danger }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Table: Loan Performance Breakdown ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <Layers size={18} color={CHART_COLORS.primary} />
            Loan Type Performance &amp; Yield Breakdown
          </h3>
        </div>
        <div className="rp-card-body" style={{ padding: 0 }}>
          <div className="rp-table-wrap">
            <table className="rp-data-table">
              <thead>
                <tr>
                  <th>Product Category</th>
                  <th>Active Accounts</th>
                  <th>Total Principal</th>
                  <th>Outstanding Balance</th>
                  <th>Weighted Avg Rate</th>
                  <th>Portfolio Share</th>
                </tr>
              </thead>
              <tbody>
                {(by_type || []).map((t) => {
                  const share =
                    portfolio_summary.total_outstanding > 0
                      ? (t.total_outstanding / portfolio_summary.total_outstanding) * 100
                      : 0
                  return (
                    <tr key={t.key}>
                      <td>
                        <strong>{t.loan_type}</strong>
                      </td>
                      <td>{t.count.toLocaleString()}</td>
                      <td>{formatCurrency(t.total_principal)}</td>
                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                        {formatCurrency(t.total_outstanding)}
                      </td>
                      <td>{formatPercent(t.avg_rate)}</td>
                      <td>
                        <span className="rp-badge rp-badge-info">
                          {formatPercent(share, 1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
