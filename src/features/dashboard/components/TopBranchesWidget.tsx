import React from 'react'
import { Building2, Award, Users } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useStatsData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface TopBranchesWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const TopBranchesWidget: React.FC<TopBranchesWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const refreshInterval = widget.settings?.refreshInterval ?? 300
  const { data, isLoading, error, refresh, lastUpdated } = useStatsData(refreshInterval)

  // branch_comparisons is only present in the bank-wide stats payload;
  // branch-scoped roles (manager/csr) receive a payload without it.
  const branches = data?.branch_comparisons ?? []

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Regional Branch Performance'}
      icon={<Building2 size={16} className="text-primary-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="branches-widget-content">
        {branches.length === 0 ? (
          <div className="branches-widget-empty" style={{ padding: '24px 12px', textAlign: 'center' }}>
            <Building2 size={22} style={{ opacity: 0.5, marginBottom: 8 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Branch comparisons are only available for institution-wide views.
            </p>
          </div>
        ) : (
        <table className="branches-widget-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Branch</th>
              <th>City</th>
              <th style={{ textAlign: 'right' }}>Customers</th>
              <th style={{ textAlign: 'right' }}>Staff</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b, idx) => (
              <tr key={b.branch_id || idx}>
                <td>
                  <span className={`branch-rank-badge rank-${idx + 1}`}>
                    {idx === 0 ? <Award size={12} className="text-amber-400" /> : `#${idx + 1}`}
                  </span>
                </td>
                <td>
                  <span className="branch-name-text">{b.branch_name}</span>
                </td>
                <td>
                  <span className="branch-city-text">{b.city}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="branch-cust-count">{b.customer_count}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="branch-staff-count">
                    <Users size={11} /> {b.employee_count}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </WidgetShell>
  )
}
