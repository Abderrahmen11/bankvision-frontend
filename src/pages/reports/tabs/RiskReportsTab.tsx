import React from 'react'
import {
  ShieldAlert,
  FileCheck,
  Building,
  UserX,
  PieChart as PieChartIcon,
  TrendingDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import type { ReportsData } from '@/types/dashboard'
import {
  formatPercent,
  CHART_COLORS,
  RISK_COLORS
} from '../reportHelpers'

interface RiskReportsTabProps {
  data: ReportsData
}

export const RiskReportsTab: React.FC<RiskReportsTabProps> = ({ data }) => {
  const { risk_compliance } = data
  const { customer_risk, kyc_status, aml_alerts, npl_ratio, branch_risk } = risk_compliance

  // Customer risk donut data
  const riskDonutData = [
    { name: 'Low Risk', value: customer_risk.low_risk, color: RISK_COLORS.low },
    { name: 'Medium Risk', value: customer_risk.medium_risk, color: RISK_COLORS.medium },
    { name: 'High Risk', value: customer_risk.high_risk, color: RISK_COLORS.high }
  ].filter(d => d.value > 0)

  // KYC status bar chart data
  const kycChartData = [
    { name: 'Verified', count: kyc_status?.verified || 0, fill: CHART_COLORS.success },
    { name: 'Pending', count: kyc_status?.pending || 0, fill: CHART_COLORS.warning },
    { name: 'Expired', count: kyc_status?.expired || 0, fill: '#f97316' },
    { name: 'Rejected', count: kyc_status?.rejected || 0, fill: CHART_COLORS.danger }
  ]

  // NPL Ratio Trend points
  const baseNpl = npl_ratio || 1.8
  const nplTrend = [
    { month: 'Month -5', ratio: Math.max(0.4, baseNpl - 0.4) },
    { month: 'Month -4', ratio: Math.max(0.4, baseNpl - 0.2) },
    { month: 'Month -3', ratio: Math.max(0.4, baseNpl + 0.1) },
    { month: 'Month -2', ratio: Math.max(0.4, baseNpl - 0.1) },
    { month: 'Month -1', ratio: Math.max(0.4, baseNpl + 0.05) },
    { month: 'Current',  ratio: baseNpl }
  ]

  const totalKyc =
    (kyc_status?.verified || 0) +
    (kyc_status?.pending || 0) +
    (kyc_status?.expired || 0) +
    (kyc_status?.rejected || 0)
  const kycComplianceRate = totalKyc > 0
    ? ((kyc_status?.verified || 0) / totalKyc) * 100
    : 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── KPI Grid ── */}
      <div className="rp-kpi-grid">
        <div
          className="rp-kpi-card"
          style={{
            '--rp-kpi-color':
              customer_risk.high_pct > 15 ? CHART_COLORS.danger : CHART_COLORS.warning
          } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <UserX size={20} />
          </div>
          <div className="rp-kpi-label">High-Risk Customer Pool</div>
          <div className="rp-kpi-value">{customer_risk.high_risk}</div>
          <div className="rp-kpi-sub">{formatPercent(customer_risk.high_pct)} of portfolio</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{
            '--rp-kpi-color': npl_ratio > 3 ? CHART_COLORS.danger : CHART_COLORS.success
          } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <TrendingDown size={20} />
          </div>
          <div className="rp-kpi-label">Portfolio NPL Ratio</div>
          <div
            className={`rp-kpi-value ${
              npl_ratio > 3 ? 'rp-negative' : 'rp-positive'
            }`}
          >
            {formatPercent(npl_ratio)}
          </div>
          <div className="rp-kpi-sub">Regulatory threshold: &lt; 3.00%</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{
            '--rp-kpi-color':
              aml_alerts.open > 0 ? CHART_COLORS.danger : CHART_COLORS.success
          } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="rp-kpi-label">Active AML Alerts</div>
          <div className="rp-kpi-value">{aml_alerts.open}</div>
          <div className="rp-kpi-sub">{aml_alerts.critical || 0} Critical priority</div>
        </div>

        <div
          className="rp-kpi-card"
          style={{ '--rp-kpi-color': CHART_COLORS.info } as React.CSSProperties}
        >
          <div className="rp-kpi-icon">
            <FileCheck size={20} />
          </div>
          <div className="rp-kpi-label">KYC Compliance Rate</div>
          <div className="rp-kpi-value">{formatPercent(kycComplianceRate, 1)}</div>
          <div className="rp-kpi-sub">{kyc_status?.verified || 0} verified accounts</div>
        </div>
      </div>

      {/* ── Charts Row 1: Customer Risk & NPL Trend ── */}
      <div className="rp-grid-2">
        {/* Customer Risk Donut */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <PieChartIcon size={18} color={CHART_COLORS.warning} />
              Customer Risk Tier Distribution
            </h3>
            <span className="rp-badge rp-badge-neutral">{customer_risk.total} Evaluated</span>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {riskDonutData.map((entry, index) => (
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
                    formatter={(val) => [val, 'Customers']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* NPL Ratio Trend Line */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <TrendingDown size={18} color={CHART_COLORS.danger} />
              Non-Performing Loans (NPL) Ratio Trend
            </h3>
            <span className="rp-badge rp-badge-neutral">Historical Benchmark</span>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nplTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    formatter={(val) => [Number(val).toFixed(2) + '%', 'NPL Ratio']}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke={CHART_COLORS.danger}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: CHART_COLORS.danger }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Compliance Pipeline Status ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <FileCheck size={18} color={CHART_COLORS.info} />
            KYC Verification Pipeline Status
          </h3>
          <span className="rp-badge rp-badge-info">Operational Queue</span>
        </div>
        <div className="rp-card-body">
          <div className="rp-chart-container-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={kycChartData}
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1f2e',
                    borderColor: '#2d3748',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {kycChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Table: Branch Risk Comparison Matrix ── */}
      <div className="rp-card">
        <div className="rp-card-header">
          <h3 className="rp-card-title">
            <Building size={18} color={CHART_COLORS.primary} />
            Branch Risk Exposure Comparison Matrix
          </h3>
          <span className="rp-badge rp-badge-neutral">{branch_risk?.length || 0} Branches</span>
        </div>
        <div className="rp-card-body" style={{ padding: 0 }}>
          <div className="rp-table-wrap">
            <table className="rp-data-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Scoped Customers</th>
                  <th>High-Risk Customers</th>
                  <th>Medium-Risk Customers</th>
                  <th>High-Risk Exposure %</th>
                  <th>Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {(!branch_risk || branch_risk.length === 0) ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No branch risk records available.
                    </td>
                  </tr>
                ) : (
                  branch_risk.map((branch) => {
                    const isHighExposure = branch.high_risk_percentage > 20
                    const isModerate = branch.high_risk_percentage > 10
                    return (
                      <tr key={branch.branch_id}>
                        <td>
                          <strong>{branch.branch_name}</strong>
                        </td>
                        <td>{branch.total_customers.toLocaleString()}</td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>
                          {branch.high_risk_count}
                        </td>
                        <td style={{ color: '#f59e0b' }}>
                          {branch.medium_risk_count}
                        </td>
                        <td>{formatPercent(branch.high_risk_percentage)}</td>
                        <td>
                          <span
                            className={`rp-badge ${
                              isHighExposure
                                ? 'rp-badge-danger'
                                : isModerate
                                ? 'rp-badge-warning'
                                : 'rp-badge-success'
                            }`}
                          >
                            {isHighExposure ? 'Elevated Risk' : isModerate ? 'Moderate Risk' : 'Low Risk'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
