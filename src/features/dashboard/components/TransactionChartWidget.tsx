import React, { useState } from 'react'
import { LineChart as LineChartIcon, Calendar } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { WidgetShell } from './WidgetShell'
import { useChartData } from '../hooks/useDashboardData'
import type { DashboardWidgetConfig } from '../types'

interface TransactionChartWidgetProps {
  widget: DashboardWidgetConfig
  onSettings?: () => void
  onRemove?: () => void
}

export const TransactionChartWidget: React.FC<TransactionChartWidgetProps> = ({
  widget,
  onSettings,
  onRemove,
}) => {
  const initialDays = widget.settings?.days ?? 30
  const chartType = widget.settings?.chartType ?? 'area'
  const refreshInterval = widget.settings?.refreshInterval ?? 120

  const [activeDays, setActiveDays] = useState<number>(initialDays)
  const { data, isLoading, error, refresh, lastUpdated } = useChartData(activeDays, refreshInterval)

  const formattedChartData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((d) => ({
      date: d.date ? d.date.slice(5) : '', // 'MM-DD'
      count: Number(d.count) || 0,
      volume: Number(d.volume) || 0,
      volumeK: Math.round((Number(d.volume) || 0) / 1000),
    }))
  }, [data])

  const formatVolumeTooltip = (val: unknown) => {
    const num = Number(val) || 0
    return [`$${num.toLocaleString()}`, 'Volume']
  }

  return (
    <WidgetShell
      id={widget.id}
      title={widget.title || 'Transaction Volume & Count Trends'}
      icon={<LineChartIcon size={16} className="text-primary-400" />}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      onSettings={onSettings}
      onRemove={onRemove}
    >
      <div className="chart-widget-container">
        {/* Time-range quick switcher */}
        <div className="chart-controls-bar">
          <div className="chart-legend-indicator">
            <span className="legend-dot" style={{ background: '#6366f1' }} />
            <span>Volume (TND)</span>
          </div>

          <div className="chart-range-pills">
            <Calendar size={12} className="text-muted" />
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                className={`chart-pill ${activeDays === days ? 'active' : ''}`}
                onClick={() => setActiveDays(days)}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="chart-canvas-wrapper" style={{ width: '100%', height: 'calc(100% - 36px)', minHeight: 180 }}>
          {formattedChartData.length === 0 ? (
            <div className="chart-empty-state">
              <p>No transaction history recorded in the selected time range.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={formatVolumeTooltip}
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={formatVolumeTooltip}
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              ) : (
                <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={formatVolumeTooltip}
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </WidgetShell>
  )
}
