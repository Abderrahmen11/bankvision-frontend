import React from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  CreditCard,
  Building2,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import type { ReportsData } from '@/features/reports'
import {
  formatCurrency,
  formatCompactNumber,
  formatPercent,
  CHART_COLORS,
  type ReportTab
} from '../reportHelpers'
import { ReportKpiCard } from './ReportKpiCard'
import { ReportChartCard } from './ReportChartCard'

interface OverviewTabProps {
  data: ReportsData
  onNavigateTab: (tab: ReportTab) => void
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data, onNavigateTab }) => {
  const { overview, income_statement, loan_analytics, risk_compliance, transaction_analytics } = data

  const isProfitable = overview.net_profit >= 0

  // Revenue vs Expense comparison chart data
  const revenueExpenseData = [
    {
      name: 'Interest',
      Revenue: income_statement.revenue.interest_income,
      Expense: income_statement.expenses.deposit_interest_expense
    },
    {
      name: 'Fees / Ops',
      Revenue: income_statement.revenue.fee_income,
      Expense: income_statement.expenses.operating_costs
    },
    {
      name: 'Provisions / Other',
      Revenue: 0,
      Expense: income_statement.expenses.credit_provisions
    }
  ]

  const trendData = transaction_analytics.daily_trends?.slice(-14) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── KPI Grid ── */}
      <div className="rp-kpi-grid">
        {/* Total Revenue */}
        <ReportKpiCard
          icon={<DollarSign size={20} />}
          label="Total Revenue"
          value={formatCurrency(overview.total_revenue, true)}
          accent={CHART_COLORS.success}
          footer={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}><span className="rp-kpi-sub">Gross operating yield</span><span className="rp-kpi-delta positive"><ArrowUpRight size={13} /> Active</span></div>}
        />

        {/* Total Expenses */}
        <ReportKpiCard
          icon={<TrendingDown size={20} />}
          label="Total Expenses"
          value={formatCurrency(overview.total_expenses, true)}
          accent={CHART_COLORS.danger}
          footer={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}><span className="rp-kpi-sub">Ops & deposit costs</span><span className="rp-kpi-delta negative"><ArrowDownRight size={13} /> Cost</span></div>}
        />

        {/* Net Profit */}
        <ReportKpiCard
          icon={<TrendingUp size={20} />}
          label="Net Profit (EAT)"
          value={formatCurrency(overview.net_profit, true)}
          accent={isProfitable ? CHART_COLORS.primary : CHART_COLORS.danger}
          valueClassName={isProfitable ? 'rp-positive' : 'rp-negative'}
          footer={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}><span className="rp-kpi-sub">Margin: {formatPercent(overview.profit_margin)}</span><span className={`rp-kpi-delta ${isProfitable ? 'positive' : 'negative'}`}>{isProfitable ? 'Profitable' : 'Deficit'}</span></div>}
        />

        {/* Transaction Volume */}
        <ReportKpiCard
          icon={<Activity size={20} />}
          label="Transaction Volume"
          value={formatCurrency(overview.transaction_volume, true)}
          accent={CHART_COLORS.info}
          footer={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}><span className="rp-kpi-sub">{overview.transaction_count.toLocaleString()} processed</span><span className="rp-kpi-delta positive"><ArrowUpRight size={13} /> Vol</span></div>}
        />
      </div>

      {/* ── Middle Charts Row ── */}
      <div className="rp-grid-2">
        {/* Transaction Trend Area Chart */}
        <ReportChartCard>
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <Activity size={18} color={CHART_COLORS.info} />
              Recent Transaction Trajectory
            </h3>
            <button
              className="rp-sub-tab"
              onClick={() => onNavigateTab('transactions')}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              View All Details &rarr;
            </button>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => formatCompactNumber(val)}
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
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={CHART_COLORS.info}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#volGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ReportChartCard>

        {/* Revenue vs Expenses Stack */}
        <ReportChartCard>
          <div className="rp-card-header">
            <h3 className="rp-card-title">
              <PieChartIcon size={18} color={CHART_COLORS.primary} />
              Revenue vs Operating Expenses Breakdown
            </h3>
            <button
              className="rp-sub-tab"
              onClick={() => onNavigateTab('financial')}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              Income Statement &rarr;
            </button>
          </div>
          <div className="rp-card-body">
            <div className="rp-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => formatCompactNumber(val)}
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
                  <Bar dataKey="Revenue" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ReportChartCard>
      </div>

      {/* ── Executive Summary Quick Navigation Cards ── */}
      <div className="rp-grid-3">
        {/* Financial Position */}
        <div className="rp-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('financial')}>
          <div className="rp-card-header">
            <h3 className="rp-card-title" style={{ fontSize: '0.85rem' }}>
              <Building2 size={16} color={CHART_COLORS.primary} />
              Balance Sheet Position
            </h3>
            <ArrowUpRight size={15} color="#64748b" />
          </div>
          <div className="rp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Total Customer Deposits:</span>
              <strong style={{ color: '#f1f5f9' }}>{formatCurrency(overview.total_deposits, true)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Gross Assets:</span>
              <strong style={{ color: '#f1f5f9' }}>{formatCurrency(data.balance_sheet.assets.total_assets, true)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Equity Reserve:</span>
              <strong style={{ color: '#10b981' }}>{formatCurrency(data.balance_sheet.equity.total_equity, true)}</strong>
            </div>
          </div>
        </div>

        {/* Loan Portfolio */}
        <div className="rp-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('loans')}>
          <div className="rp-card-header">
            <h3 className="rp-card-title" style={{ fontSize: '0.85rem' }}>
              <CreditCard size={16} color={CHART_COLORS.warning} />
              Loan Portfolio Health
            </h3>
            <ArrowUpRight size={15} color="#64748b" />
          </div>
          <div className="rp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Outstanding Balance:</span>
              <strong style={{ color: '#f1f5f9' }}>{formatCurrency(loan_analytics.portfolio_summary.total_outstanding, true)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Delinquency Rate:</span>
              <strong style={{ color: loan_analytics.portfolio_summary.delinquency_rate > 5 ? '#ef4444' : '#10b981' }}>
                {formatPercent(loan_analytics.portfolio_summary.delinquency_rate)}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Avg Interest Rate:</span>
              <strong style={{ color: '#f1f5f9' }}>{formatPercent(loan_analytics.portfolio_summary.avg_interest_rate)}</strong>
            </div>
          </div>
        </div>

        {/* Risk & Compliance */}
        <div className="rp-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('risk')}>
          <div className="rp-card-header">
            <h3 className="rp-card-title" style={{ fontSize: '0.85rem' }}>
              <ShieldAlert size={16} color={CHART_COLORS.danger} />
              Risk & Compliance Posture
            </h3>
            <ArrowUpRight size={15} color="#64748b" />
          </div>
          <div className="rp-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>High Risk Customers:</span>
              <strong style={{ color: '#ef4444' }}>
                {risk_compliance.customer_risk.high_risk} ({formatPercent(risk_compliance.customer_risk.high_pct)})
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>Open AML Alerts:</span>
              <strong style={{ color: risk_compliance.aml_alerts.open > 0 ? '#f59e0b' : '#10b981' }}>
                {risk_compliance.aml_alerts.open} Open
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#94a3b8' }}>KYC Verified Ratio:</span>
              <strong style={{ color: '#10b981' }}>
                {risk_compliance.kyc_status.verified} Verified
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
