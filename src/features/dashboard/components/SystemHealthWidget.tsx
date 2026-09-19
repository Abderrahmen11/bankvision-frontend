import React, { useCallback, useEffect, useState } from 'react'
import { Activity, Server, Database, HardDrive, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { WidgetShell } from './WidgetShell'
import { settingsApi } from '@/features/settings/api/settings'
import type { SystemHealth } from '@/features/settings/types'
import type { DashboardWidgetConfig } from '../types'

interface SystemHealthWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

const POLL_INTERVAL_MS = 30_000

function overallStatus(health: SystemHealth): 'healthy' | 'degraded' | 'down' {
  const statuses = [health.database.status, health.cache.status, health.storage.status]
  if (statuses.includes('down')) return 'down'
  if (statuses.includes('degraded')) return 'degraded'
  return 'healthy'
}

const STATUS_META = {
  healthy: { label: 'All Systems Operational', icon: <CheckCircle2 size={13} />, color: '#34d399' },
  degraded: { label: 'Systems Degraded', icon: <AlertTriangle size={13} />, color: '#fbbf24' },
  down: { label: 'Service Disruption', icon: <XCircle size={13} />, color: '#f87171' },
} as const

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [apiLatency, setApiLatency] = useState<number | null>(null)

  const loadHealth = useCallback(async () => {
    const fetchStart = performance.now()
    setIsLoading(true)
    setError(null)
    try {
      const data = await settingsApi.getSystemHealth()
      setHealth(data)
      setLastUpdated(new Date())
      setApiLatency(Math.round(performance.now() - fetchStart))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health data unavailable.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const tick = () => {
      if (active) loadHealth()
    }
    tick()
    const interval = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [loadHealth])

  // Measured round-trip of the actual health request - real API latency
  const status = health ? overallStatus(health) : null
  const statusMeta = status ? STATUS_META[status] : null

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Infrastructure & System Health'}
      icon={<Activity size={16} className="text-emerald-400" />}
      isLoading={isLoading && !health}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={loadHealth}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="system-health-container">
        {/* Top Status Banner */}
        <div className="health-status-banner">
          <div className="health-status-indicator">
            <span className="pulsing-health-dot" style={statusMeta ? { background: statusMeta.color } : undefined} />
            <span className="health-status-text">{statusMeta?.label ?? 'Checking status…'}</span>
          </div>
          {health && (
            <span className="health-uptime-badge">{health.database.latency_ms} ms DB</span>
          )}
        </div>

        {/* Metrics Grid - sourced from /settings/system/health */}
        {health ? (
          <div className="health-metrics-grid">
            <div className="health-metric-tile">
              <div className="tile-icon-header">
                <Server size={14} className="text-indigo-400" />
                <span>API Latency</span>
              </div>
              <div className="tile-value-wrap">
                <span className="tile-value">{apiLatency !== null ? `${apiLatency} ms` : '-'}</span>
                <span className={`tile-badge ${status === 'healthy' ? 'positive' : status === 'degraded' ? 'neutral' : 'negative'}`}>
                  {statusMeta?.label ?? '-'}
                </span>
              </div>
            </div>

            <div className="health-metric-tile">
              <div className="tile-icon-header">
                <Database size={14} className="text-cyan-400" />
                <span>Database</span>
              </div>
              <div className="tile-value-wrap">
                <span className="tile-value">{health.database.latency_ms} ms</span>
                <span className={`tile-badge ${health.database.status === 'healthy' ? 'positive' : 'negative'}`}>
                  {health.database.status}
                </span>
              </div>
            </div>

            <div className="health-metric-tile">
              <div className="tile-icon-header">
                <Activity size={14} className="text-emerald-400" />
                <span>Cache ({health.cache.driver})</span>
              </div>
              <div className="tile-value-wrap">
                <span className={`tile-badge ${health.cache.status === 'healthy' ? 'positive' : 'neutral'}`}>
                  {health.cache.status}
                </span>
              </div>
            </div>

            <div className="health-metric-tile">
              <div className="tile-icon-header">
                <HardDrive size={14} className="text-amber-400" />
                <span>Disk Usage</span>
              </div>
              <div className="tile-value-wrap">
                <span className="tile-value">{health.storage.disk_used_pct}%</span>
                <span className={`tile-badge ${health.storage.disk_used_pct > 85 ? 'negative' : 'positive'}`}>
                  {health.storage.status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="health-empty-state">
            {error ?? 'Loading health metrics…'}
          </div>
        )}

        {/* Activity counters (real ledger figures) */}
        {health && (
          <div className="health-nodes-row">
            <span className="nodes-title">Open Alerts:</span>
            <div className="nodes-badges-list">
              <span className="node-pill">{health.activity.open_alerts} open</span>
              <span className="node-pill">{health.activity.pending_transactions} pending txns</span>
              <span className="node-pill">{health.activity.active_sessions} sessions</span>
            </div>
          </div>
        )}
      </div>
    </WidgetShell>
  )
}
