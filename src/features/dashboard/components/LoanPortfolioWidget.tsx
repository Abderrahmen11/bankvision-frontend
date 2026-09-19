import { formatMoney } from '@/shared/utils'
import React from 'react'
import { BadgePercent, AlertTriangle, ShieldCheck } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useReportsData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface LoanPortfolioWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const LoanPortfolioWidget: React.FC<LoanPortfolioWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const refreshInterval = widget.settings?.refreshInterval ?? 300
  const { data, isLoading, error, refresh, lastUpdated } = useReportsData(refreshInterval)

  // loan_portfolio is the dashboard-shaped summary; loan_analytics.portfolio_summary
  // carries the fuller report figures (real delinquency/NPL). Prefer the summary object.
  const portfolio = data?.loan_portfolio
  const summary = data?.loan_analytics?.portfolio_summary

  const totalPrincipal = portfolio?.total_principal ?? summary?.total_principal ?? null
  const totalOutstanding = portfolio?.total_outstanding ?? summary?.total_outstanding ?? null
  const delinquencyRate = summary?.delinquency_rate ?? null
  const nplRatio = summary?.npl_ratio ?? null

  const hasPortfolio = totalPrincipal !== null || totalOutstanding !== null
  const recoveryRatio =
    totalPrincipal && totalOutstanding !== null
      ? Math.round(((totalPrincipal - totalOutstanding) / (totalPrincipal || 1)) * 100)
      : null

  /** NPL ratio bands → underwriting risk label (derived from real figures). */
  const riskLevel =
    nplRatio === null ? null : nplRatio < 2 ? 'Low' : nplRatio < 5 ? 'Moderate' : 'Elevated'

  const formatCurrency = (val: number) =>
    formatMoney(Math.round(val || 0), { decimal_places: 0, decimal_separator: '.', thousand_separator: ',' })

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Loan Portfolio & Risk Distribution'}
      icon={<BadgePercent size={16} className="text-amber-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="loan-portfolio-content">
        {hasPortfolio ? (
          <>
            <div className="portfolio-stat-row">
              <div className="portfolio-substat">
                <span className="substat-label">Total Principal</span>
                <span className="substat-value text-emerald-400">
                  {totalPrincipal !== null ? formatCurrency(totalPrincipal) : '-'}
                </span>
              </div>
              <div className="portfolio-substat">
                <span className="substat-label">Total Outstanding</span>
                <span className="substat-value text-amber-400">
                  {totalOutstanding !== null ? formatCurrency(totalOutstanding) : '-'}
                </span>
              </div>
            </div>

            {/* Repayment Progress Bar */}
            {recoveryRatio !== null && (
              <div className="loan-progress-wrap">
                <div className="loan-progress-labels">
                  <span>Portfolio Amortization</span>
                  <span>{Math.max(0, recoveryRatio)}% Repaid</span>
                </div>
                <div className="loan-progress-track">
                  <div
                    className="loan-progress-fill"
                    style={{ width: `${Math.min(100, Math.max(5, recoveryRatio))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Loan Breakdown Types */}
            <div className="loan-types-list">
              {portfolio?.breakdown_by_type && Object.keys(portfolio.breakdown_by_type).length > 0 ? (
                Object.entries(portfolio.breakdown_by_type).map(([type, rawStats]) => {
                  const stats = rawStats as { count: number; outstanding: number }
                  return (
                    <div key={type} className="loan-type-item">
                      <span className="loan-type-name">{type.toUpperCase()} LOANS</span>
                      <span className="loan-type-count">{stats.count} active</span>
                      <span className="loan-type-amt">{formatCurrency(stats.outstanding)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="loan-type-item">
                  <span className="loan-type-name" style={{ color: 'var(--text-muted)' }}>
                    No loan type breakdown available
                  </span>
                </div>
              )}
            </div>

            {(riskLevel !== null || delinquencyRate !== null) && (
              <div className="portfolio-status-footer">
                {riskLevel !== null && (
                  <div className="status-badge-inline">
                    <ShieldCheck
                      size={14}
                      className={riskLevel === 'Elevated' ? 'text-amber-400' : 'text-emerald-400'}
                    />
                    <span>Underwriting Risk: {riskLevel}</span>
                  </div>
                )}
                {delinquencyRate !== null && (
                  <div className="status-badge-inline">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span>Delinquency: {delinquencyRate}%</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div
            className="loan-type-item"
            style={{ justifyContent: 'center', padding: '1.5rem 0', color: 'var(--text-muted)' }}
          >
            <span className="loan-type-name">No loan portfolio data available yet.</span>
          </div>
        )}
      </div>
    </WidgetShell>
  )
}
