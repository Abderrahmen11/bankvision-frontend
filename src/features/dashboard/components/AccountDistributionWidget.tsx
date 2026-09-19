import React from 'react'
import { PieChart as PieChartIcon } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { WidgetShell } from './WidgetShell'
import { useStatsData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface AccountDistributionWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899']

export const AccountDistributionWidget: React.FC<AccountDistributionWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const refreshInterval = widget.settings?.refreshInterval ?? 300
  const { data, isLoading, error, refresh, lastUpdated } = useStatsData(refreshInterval)

  const chartData = React.useMemo(() => {
    const totalAccounts = data?.total_accounts ?? 0
    const activeAccounts = data?.active_accounts ?? 0
    const inactiveAccounts = Math.max(0, totalAccounts - activeAccounts)
    const totalLoans = data?.total_loans ?? 0

    // total_accounts is absent from branch-scoped stats payloads — nothing
    // real to chart in that case.
    if (totalAccounts === 0) return []

    return [
      { name: 'Active Accounts', value: activeAccounts },
      { name: 'Frozen / Closed', value: inactiveAccounts },
      { name: 'Loan Accounts', value: totalLoans },
    ]
  }, [data])

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Account Types & Portfolio Breakdown'}
      icon={<PieChartIcon size={16} className="text-cyan-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="account-dist-container">
        {chartData.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <PieChartIcon size={22} style={{ opacity: 0.5, marginBottom: 8 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Account distribution is only available for institution-wide views.
            </p>
          </div>
        ) : (
        <>
        <div className="pie-chart-wrap" style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dist-legend-list">
          {chartData.map((item, idx) => (
            <div key={item.name} className="dist-legend-item">
              <span className="legend-indicator" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="dist-legend-name">{item.name}</span>
              <span className="dist-legend-value">{item.value}</span>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </WidgetShell>
  )
}
