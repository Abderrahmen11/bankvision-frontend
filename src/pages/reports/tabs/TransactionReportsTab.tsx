import React from 'react'
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Send
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
  formatDate,
  CHART_COLORS,
  CHART_PALETTE
} from '../reportHelpers'

interface TransactionReportsTabProps {
  data: ReportsData
}

export const TransactionReportsTab: React.FC<TransactionReportsTabProps> = ({ data }) => {
  const { transaction_analytics } = data
  const { by_type, by_channel, daily_trends, high_value_transactions, total_count, total_volume } =
    transaction_analytics

  // Transform by_type for chart
  const typeChartData = (by_type || []).map((t) => ({
    name: t.name || t.key || 'Unknown',
    Volume: t.total_amount ?? 0,
    Count: t.count ?? 0
  }))

  // Transform by_channel for pie chart
  const channelChartData = (by_channel || []).map((c) => ({
    name: c.name || c.key || 'Unknown',
    value: c.total_amount ?? 0,
    count: c.count ?? 0
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Summary Stats Strip ── */}
      <div className="rp-kpi-grid">
        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.primary } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <BarChart3 size={20} />
          </div>
          <div className="rp-kpi-label">Total Cleared Volume</div>
          <div className="rp-kpi-value">{formatCurrency(total_volume, true)}</div>
          <div className="rp-kpi-sub">{total_count.toLocaleString()} ledger movements</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.success } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <TrendingUp size={20} />
          </div>
          <div className="rp-kpi-label">Average Transaction Size</div>
          <div className="rp-kpi-value">
            {formatCurrency(total_count > 0 ? total_volume / total_count : 0)}
          </div>
          <div className="rp-kpi-sub">Across all transaction types</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.warning } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="rp-kpi-label">High-Value Transfers</div>
          <div className="rp-kpi-value">{high_value_transactions?.length || 0}</div>
          <div className="rp-kpi-sub">Transactions exceeding $10,000</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.info } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <Send size={20} />
          </div>
          <div className="rp-kpi-label">Top Transaction Channel</div>
          <div className="rp-kpi-value">
            {channelChartData[0]?.name || 'ONLINE'}
          </div>
          <div className="rp-kpi-sub">
            {formatCurrency(channelChartData[0]?.value || 0, true)} cleared
          </div>
        </div>
      </div>

      {/* ── Charts Row 1: Volume by Type & Volume by Channel ── */}
      <div className="rp-grid-2">
        {/* Bar chart: Transaction Volume by Type */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <BarChart3 size={18} color={CHART_COLORS.primary} />
              Transaction Volume by Type
            </h3>
            <span className="rp-badge rp-badge-info">Categorized</span>
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
                    formatter={(val) => [formatCurrency(Number(val) || 0), 'Volume']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Volume" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie chart: Transaction Volume by Channel */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <PieChartIcon size={18} color={CHART_COLORS.success} />
              Transaction Volume by Channel
            </h3>
            <span className="rp-badge rp-badge-neutral">Distribution</span>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {channelChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1f2e',
                      borderColor: '#2d3748',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(val) => [formatCurrency(Number(val) || 0), 'Volume']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Daily / Monthly Trend (Line Chart) ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <TrendingUp size={18} color={CHART_COLORS.info} />
            Daily Transaction Trends (Volume &amp; Count)
          </h3>
          <span className="rp-badge rp-badge-neutral">{daily_trends?.length || 0} Data Points</span>
        </div>
        <div className="rp-card-body">
          <div className="rp-chart-container-lg">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatCompactNumber(v)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.toString()}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    borderColor: '#2d3748',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(val, name) => [
                    name === 'Volume ($)' ? formatCurrency(Number(val) || 0) : val,
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="volume"
                  name="Volume ($)"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  name="Count (Tx)"
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── High-Value Transactions Table ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <CreditCard size={18} color={CHART_COLORS.warning} />
            High-Value Transactions Register (&gt; $10,000)
          </h3>
          <span className="rp-badge rp-badge-warning">AML Auditable</span>
        </div>
        <div className="rp-card-body" style={{ padding: 0 }}>
          <div className="rp-table-wrap">
            <table className="rp-data-table">
              <thead>
                <tr>
                  <th>Tx Reference</th>
                  <th>Customer / Account</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(!high_value_transactions || high_value_transactions.length === 0) ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No high-value transactions recorded for this period.
                    </td>
                  </tr>
                ) : (
                  high_value_transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <strong>{tx.transaction_number}</strong>
                      </td>
                      <td>
                        <div>{tx.customer_name || 'Account Holder'}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                          {tx.account_number || `ID #${tx.id}`}
                        </div>
                      </td>
                      <td>
                        <span className="rp-badge rp-badge-neutral">
                          {tx.type}
                        </span>
                      </td>
                      <td>{tx.channel?.toUpperCase() || 'ONLINE'}</td>
                      <td style={{ fontWeight: 700, color: '#f1f5f9' }}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <span
                          className={`rp-badge ${
                            tx.status === 'completed'
                              ? 'rp-badge-success'
                              : tx.status === 'pending'
                              ? 'rp-badge-warning'
                              : 'rp-badge-danger'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td>{formatDate(tx.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
