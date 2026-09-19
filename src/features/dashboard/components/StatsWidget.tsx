import { formatMoney } from '@/shared/utils'
import React from 'react'
import { TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight, Wallet, DollarSign } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useStatsData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface StatsWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ widget, onSettings, onRemove }) => {
  const refreshInterval = widget.settings?.refreshInterval ?? 60
  const { data, isLoading, error, refresh, lastUpdated } = useStatsData(refreshInterval)

  const formatCurrency = (val: number) =>
    formatMoney(Math.round(val || 0), { decimal_places: 0, decimal_separator: '.', thousand_separator: ',' })

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('en-US').format(val || 0)

  // Branch-scoped variant (manager/csr): only today's desk metrics are returned
  const isBranchScope =
    data != null &&
    data.total_customers === undefined &&
    (data.new_customers_today !== undefined || data.customers_served_today !== undefined)

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Key Performance Indicators'}
      icon={<TrendingUp size={16} className="text-primary-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      {isBranchScope ? (
        /* Branch-scoped payload: today's desk metrics for managers/CSRs */
        <div className="stats-widget-grid">
          <div className="stats-kpi-card">
            <div className="stats-kpi-icon-wrapper bg-indigo-subtle">
              <Users size={18} className="text-indigo-400" />
            </div>
            <div className="stats-kpi-info">
              <span className="stats-kpi-label">New Customers Today</span>
              <div className="stats-kpi-value-row">
                <span className="stats-kpi-value">{formatNumber(data?.new_customers_today || 0)}</span>
              </div>
              <span className="stats-kpi-subtext">
                {formatNumber(data?.customers_served_today || 0)} customers served today
              </span>
            </div>
          </div>

          <div className="stats-kpi-card">
            <div className="stats-kpi-icon-wrapper bg-cyan-subtle">
              <CreditCard size={18} className="text-cyan-400" />
            </div>
            <div className="stats-kpi-info">
              <span className="stats-kpi-label">Pending Transactions</span>
              <div className="stats-kpi-value-row">
                <span className="stats-kpi-value">{formatNumber(data?.pending_transactions || 0)}</span>
              </div>
              <span className="stats-kpi-subtext">
                {formatNumber(data?.pending_requests || 0)} pending requests
              </span>
            </div>
          </div>

          <div className="stats-kpi-card">
            <div className="stats-kpi-icon-wrapper bg-amber-subtle">
              <DollarSign size={18} className="text-amber-400" />
            </div>
            <div className="stats-kpi-info">
              <span className="stats-kpi-label">Pending Loans</span>
              <div className="stats-kpi-value-row">
                <span className="stats-kpi-value">{formatNumber(data?.pending_loans || 0)}</span>
              </div>
              <span className="stats-kpi-subtext">awaiting approval</span>
            </div>
          </div>

          <div className="stats-kpi-card">
            <div className="stats-kpi-icon-wrapper bg-emerald-subtle">
              <Wallet size={18} className="text-emerald-400" />
            </div>
            <div className="stats-kpi-info">
              <span className="stats-kpi-label">Open Alerts</span>
              <div className="stats-kpi-value-row">
                <span className="stats-kpi-value">{formatNumber(data?.open_alerts || 0)}</span>
              </div>
              <span className="stats-kpi-subtext">
                {formatNumber(data?.pending_actions || 0)} pending actions total
              </span>
            </div>
          </div>
        </div>
      ) : (
      <div className="stats-widget-grid">
        {/* Total Customers */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon-wrapper bg-indigo-subtle">
            <Users size={18} className="text-indigo-400" />
          </div>
          <div className="stats-kpi-info">
            <span className="stats-kpi-label">Total Customers</span>
            <div className="stats-kpi-value-row">
              <span className="stats-kpi-value">{formatNumber(data?.total_customers || 0)}</span>
              {data?.new_customers_today ? (
                <span className="stats-kpi-badge positive" title="New accounts registered today">
                  <ArrowUpRight size={12} /> +{data.new_customers_today}
                </span>
              ) : null}
            </div>
            <span className="stats-kpi-subtext">
              {formatNumber(data?.customer_growth || 0)} new in last 30d
            </span>
          </div>
        </div>

        {/* Total Deposits */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon-wrapper bg-emerald-subtle">
            <Wallet size={18} className="text-emerald-400" />
          </div>
          <div className="stats-kpi-info">
            <span className="stats-kpi-label">Total Deposits</span>
            <div className="stats-kpi-value-row">
              <span className="stats-kpi-value">{formatCurrency(data?.total_deposits || 0)}</span>
            </div>
            <span className="stats-kpi-subtext">
              Avg Balance: {formatCurrency(data?.average_account_balance || 0)}
            </span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon-wrapper bg-cyan-subtle">
            <CreditCard size={18} className="text-cyan-400" />
          </div>
          <div className="stats-kpi-info">
            <span className="stats-kpi-label">Active Accounts</span>
            <div className="stats-kpi-value-row">
              <span className="stats-kpi-value">{formatNumber(data?.active_accounts || 0)}</span>
              <span className="stats-kpi-badge neutral">
                {data?.total_accounts ? Math.round(((data.active_accounts || 0) / data.total_accounts) * 100) : 100}%
              </span>
            </div>
            <span className="stats-kpi-subtext">
              of {formatNumber(data?.total_accounts || 0)} total accounts
            </span>
          </div>
        </div>

        {/* Total Loan Portfolio */}
        <div className="stats-kpi-card">
          <div className="stats-kpi-icon-wrapper bg-amber-subtle">
            <DollarSign size={18} className="text-amber-400" />
          </div>
          <div className="stats-kpi-info">
            <span className="stats-kpi-label">Loan Portfolio</span>
            <div className="stats-kpi-value-row">
              <span className="stats-kpi-value">{formatCurrency(data?.total_loan_amount || 0)}</span>
              {data?.loan_default_rate !== undefined && (
                <span className={`stats-kpi-badge ${data.loan_default_rate > 3 ? 'negative' : 'positive'}`}>
                  {data.loan_default_rate > 3 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  {data.loan_default_rate}% def
                </span>
              )}
            </div>
            <span className="stats-kpi-subtext">
              {formatNumber(data?.total_loans || 0)} loans ({data?.pending_loans || 0} pending)
            </span>
          </div>
        </div>
      </div>
      )}
    </WidgetShell>
  )
}
