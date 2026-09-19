import React from 'react'
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { useRecentActivityData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface AlertsPanelWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const AlertsPanelWidget: React.FC<AlertsPanelWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const limit = widget.settings?.limit ?? 6
  const severityFilter = widget.settings?.severity ?? 'all'
  const refreshInterval = widget.settings?.refreshInterval ?? 30
  const { data, isLoading, error, refresh, lastUpdated } = useRecentActivityData(limit, refreshInterval)
  const alertData = data?.alerts

  const alerts = React.useMemo(() => {
    if (!alertData) return []
    if (severityFilter === 'all') return alertData
    return alertData.filter((a) => a.severity === severityFilter)
  }, [alertData, severityFilter])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert size={15} className="text-rose-400" />
      case 'high':
        return <AlertTriangle size={15} className="text-amber-400" />
      case 'medium':
        return <AlertCircle size={15} className="text-yellow-400" />
      default:
        return <Info size={15} className="text-blue-400" />
    }
  }

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Risk & System Alerts'}
      icon={<AlertTriangle size={16} className="text-amber-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="alerts-widget-feed">
        {alerts.length === 0 ? (
          <div className="alerts-empty-state">
            <ShieldAlert size={28} className="text-emerald-400" />
            <p>No active alerts matching criteria.</p>
            <span>All systems and accounts operating normally.</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-item-card severity-${alert.severity}`}>
              <div className="alert-item-icon">{getSeverityIcon(alert.severity)}</div>
              <div className="alert-item-content">
                <div className="alert-item-top">
                  <span className="alert-item-code">{alert.alert_number}</span>
                  <span className={`alert-severity-pill ${alert.severity}`}>{alert.severity}</span>
                </div>
                <p className="alert-item-desc">{alert.description}</p>
                <div className="alert-item-footer">
                  <span className="alert-item-type">{alert.alert_type}</span>
                  <span className="alert-item-time">
                    {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetShell>
  )
}
