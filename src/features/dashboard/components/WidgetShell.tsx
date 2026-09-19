import React, { useState, useEffect } from 'react'
import {
  GripVertical,
  RotateCw,
  Settings,
  Maximize2,
  Minimize2,
  X,
  AlertCircle,
} from 'lucide-react'

interface WidgetShellProps {
  id: string
  title: string
  icon?: React.ReactNode
  isLoading?: boolean
  error?: string | null
  lastUpdated?: Date | null
  onRefresh?: () => void
  onSettings?: () => void
  onRemove?: () => void
  children: React.ReactNode
  className?: string
}

export const WidgetShell: React.FC<WidgetShellProps> = ({
  title,
  icon,
  isLoading = false,
  error = null,
  lastUpdated,
  onRefresh,
  onSettings,
  onRemove,
  children,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Escape key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <div
      className={`widget-shell ${isFullscreen ? 'widget-shell-fullscreen' : ''} ${className}`}
    >
      {/* Widget Header Toolbar - doubles as the grid drag handle */}
      <div className="widget-header" title="Drag to reposition widget">
        <div className="widget-header-left">
          {/* Grip affordance (drag is live across the whole header) */}
          <div className="widget-drag-handle">
            <GripVertical size={16} />
          </div>

          {icon && <div className="widget-icon-wrap">{icon}</div>}
          <h3 className="widget-title" title={title}>
            {title}
          </h3>
        </div>

        <div className="widget-actions">
          {lastUpdated && (
            <span
              className="widget-last-updated"
              title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            >
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {onRefresh && (
            <button
              type="button"
              className={`widget-action-btn ${isLoading ? 'spinning' : ''}`}
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh widget data"
            >
              <RotateCw size={14} />
            </button>
          )}

          {onSettings && (
            <button
              type="button"
              className="widget-action-btn"
              onClick={onSettings}
              title="Configure widget"
            >
              <Settings size={14} />
            </button>
          )}

          <button
            type="button"
            className="widget-action-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {onRemove && (
            <button
              type="button"
              className="widget-action-btn widget-action-remove"
              onClick={onRemove}
              title="Remove widget from dashboard"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content Area */}
      <div className="widget-body">
        {isLoading && !children ? (
          <div className="widget-skeleton-wrap">
            <div className="skeleton-bar title-bar" />
            <div className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
            <div className="skeleton-bar text-bar" />
          </div>
        ) : error ? (
          <div className="widget-error-state">
            <AlertCircle size={24} className="text-danger" />
            <p className="widget-error-message">{error}</p>
            {onRefresh && (
              <button
                type="button"
                className="widget-retry-btn"
                onClick={onRefresh}
              >
                <RotateCw size={12} /> Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
