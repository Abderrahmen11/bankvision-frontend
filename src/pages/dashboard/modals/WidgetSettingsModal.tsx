import React, { useState, useEffect } from 'react'
import { X, Save, Sliders, Clock, BarChart2 } from 'lucide-react'
import type { DashboardWidgetConfig, WidgetSettings } from '@/types/dashboard'

interface WidgetSettingsModalProps {
  isOpen: boolean
  widget: DashboardWidgetConfig | null
  onClose: () => void
  onSave: (id: string, settings: WidgetSettings, title: string) => void
}

export const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  isOpen,
  widget,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('')
  const [refreshInterval, setRefreshInterval] = useState<number>(60)
  const [days, setDays] = useState<number>(30)
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [limit, setLimit] = useState<number>(10)
  const [severity, setSeverity] = useState<string>('all')

  useEffect(() => {
    if (widget) {
      setTitle(widget.title || '')
      setRefreshInterval(widget.settings?.refreshInterval ?? 60)
      setDays(widget.settings?.days ?? 30)
      setChartType(widget.settings?.chartType ?? 'area')
      setLimit(widget.settings?.limit ?? 10)
      setSeverity(widget.settings?.severity ?? 'all')
    }
  }, [widget])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !widget) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedSettings: WidgetSettings = {
      ...widget.settings,
      refreshInterval,
      ...(widget.type === 'transaction_chart' ? { days, chartType } : {}),
      ...(widget.type === 'alerts_panel' ? { limit, severity: severity as WidgetSettings['severity'] } : {}),
      ...(widget.type === 'recent_transactions' ? { limit } : {}),
    }

    onSave(widget.id, updatedSettings, title)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window glass-modal settings-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} className="text-primary-400" />
              <h2 className="modal-title">Configure Widget</h2>
            </div>
            <p className="modal-subtitle">Customize display properties and data fetch options.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="settings-form">
          {/* Widget Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="widget-title-input">
              Widget Title
            </label>
            <input
              id="widget-title-input"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Custom title..."
              required
            />
          </div>

          {/* Refresh Interval */}
          <div className="form-group">
            <label className="form-label" htmlFor="widget-refresh-select">
              <Clock size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
              Auto-Refresh Cadence
            </label>
            <select
              id="widget-refresh-select"
              className="form-select"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={0}>Manual Only (No Auto-Refresh)</option>
              <option value={15}>Every 15 seconds</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every 1 minute (Recommended)</option>
              <option value={120}>Every 2 minutes</option>
              <option value={300}>Every 5 minutes</option>
            </select>
          </div>

          {/* Chart-specific settings */}
          {widget.type === 'transaction_chart' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <BarChart2 size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                  Chart Visualization Type
                </label>
                <div className="radio-pills-row">
                  {(['area', 'line', 'bar'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`radio-pill ${chartType === type ? 'active' : ''}`}
                      onClick={() => setChartType(type)}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="chart-days-select">
                  Default Time Horizon
                </label>
                <select
                  id="chart-days-select"
                  className="form-select"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={14}>Last 14 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                </select>
              </div>
            </>
          )}

          {/* Alerts-specific settings */}
          {widget.type === 'alerts_panel' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="alert-severity-select">
                  Severity Filter
                </label>
                <select
                  id="alert-severity-select"
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="all">All Alerts</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High & Critical</option>
                  <option value="medium">Medium, High & Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="alert-limit-select">
                  Maximum Visible Alerts
                </label>
                <select
                  id="alert-limit-select"
                  className="form-select"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                >
                  <option value={4}>4 items</option>
                  <option value={6}>6 items</option>
                  <option value={8}>8 items</option>
                  <option value={12}>12 items</option>
                </select>
              </div>
            </>
          )}

          {/* Recent transactions settings */}
          {widget.type === 'recent_transactions' && (
            <div className="form-group">
              <label className="form-label" htmlFor="txn-limit-select">
                Page Size / Row Limit
              </label>
              <select
                id="txn-limit-select"
                className="form-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={5}>5 transactions</option>
                <option value={10}>10 transactions</option>
                <option value={15}>15 transactions</option>
                <option value={20}>20 transactions</option>
              </select>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={14} /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
