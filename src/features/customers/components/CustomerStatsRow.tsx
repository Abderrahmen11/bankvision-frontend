import React from 'react'
import { Users, ShieldCheck, AlertTriangle, DollarSign } from 'lucide-react'
import { formatCurrency } from '../customerHelpers'

interface CustomerStatsRowProps {
  totalCount: number
  totalVerified: number
  totalHighRisk: number
  totalPortfolioBalance: number
}

export const CustomerStatsRow: React.FC<CustomerStatsRowProps> = ({
  totalCount,
  totalVerified,
  totalHighRisk,
  totalPortfolioBalance,
}) => {
  return (
    <div className="cm-stats-row">
      <div className="cm-stat-card">
        <div className="cm-stat-header">
          <span className="cm-stat-label">Total Customers</span>
          <div
            className="cm-stat-icon"
            style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary-400)' }}
          >
            <Users size={16} />
          </div>
        </div>
        <span className="cm-stat-value">{totalCount}</span>
        <span className="cm-stat-sub">Active registry profiles</span>
      </div>

      <div className="cm-stat-card">
        <div className="cm-stat-header">
          <span className="cm-stat-label">KYC Verified</span>
          <div
            className="cm-stat-icon"
            style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--emerald-500)' }}
          >
            <ShieldCheck size={16} />
          </div>
        </div>
        <span className="cm-stat-value">{totalVerified}</span>
        <span className="cm-stat-sub">Verified in current view</span>
      </div>

      <div className="cm-stat-card">
        <div className="cm-stat-header">
          <span className="cm-stat-label">High Risk Exposure</span>
          <div
            className="cm-stat-icon"
            style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--rose-500)' }}
          >
            <AlertTriangle size={16} />
          </div>
        </div>
        <span
          className="cm-stat-value"
          style={{ color: totalHighRisk > 0 ? 'var(--rose-500)' : 'inherit' }}
        >
          {totalHighRisk}
        </span>
        <span className="cm-stat-sub">Requires monitoring</span>
      </div>

      <div className="cm-stat-card">
        <div className="cm-stat-header">
          <span className="cm-stat-label">Portfolio Balance</span>
          <div
            className="cm-stat-icon"
            style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--cyan-500)' }}
          >
            <DollarSign size={16} />
          </div>
        </div>
        <span className="cm-stat-value" style={{ fontSize: '1.35rem' }}>
          {formatCurrency(totalPortfolioBalance)}
        </span>
        <span className="cm-stat-sub">Aggregated in current batch</span>
      </div>
    </div>
  )
}
