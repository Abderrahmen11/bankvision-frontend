import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Check,
  Search,
  LayoutGrid,
  TrendingUp,
  LineChart,
  AlertTriangle,
  Receipt,
  PieChart,
  BadgePercent,
  Building2,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import type { UserRole } from '@/shared/types/user'
import type { WidgetType, DashboardWidgetConfig } from '../types'
import { getAvailableWidgetsForRole } from '../config/widgetRegistry'

interface AddWidgetModalProps {
  isOpen: boolean
  onClose: () => void
  onAddWidget: (type: WidgetType) => void
  currentWidgets: DashboardWidgetConfig[]
  role: UserRole
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
  currentWidgets,
  role,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const availableWidgets = getAvailableWidgetsForRole(role)
  const currentWidgetTypes = new Set(currentWidgets.map((w) => w.type))

  const filteredWidgets = availableWidgets.filter(
    (w) =>
      w.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getWidgetIcon = (type: WidgetType) => {
    switch (type) {
      case 'stats':
        return <TrendingUp size={20} className="text-primary-400" />
      case 'transaction_chart':
        return <LineChart size={20} className="text-primary-400" />
      case 'alerts_panel':
        return <AlertTriangle size={20} className="text-amber-400" />
      case 'recent_transactions':
        return <Receipt size={20} className="text-primary-400" />
      case 'account_distribution':
        return <PieChart size={20} className="text-cyan-400" />
      case 'loan_portfolio':
        return <BadgePercent size={20} className="text-amber-400" />
      case 'top_branches':
        return <Building2 size={20} className="text-primary-400" />
      case 'system_health':
        return <Activity size={20} className="text-emerald-400" />
      case 'compliance':
        return <ShieldCheck size={20} className="text-emerald-400" />
      default:
        return <LayoutGrid size={20} className="text-primary-400" />
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window glass-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <h2 className="modal-title">Widget Catalogue</h2>
            <p className="modal-subtitle">
              Add modular widgets to your personalized workspace.
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="modal-search-bar">
          <Search size={16} className="modal-search-icon" />
          <input
            type="text"
            className="modal-search-input"
            placeholder="Search available widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Widgets Grid */}
        <div className="modal-widgets-grid">
          {filteredWidgets.length === 0 ? (
            <div className="modal-empty-state">
              <p>No widgets match your search.</p>
            </div>
          ) : (
            filteredWidgets.map((item) => {
              const isAdded = currentWidgetTypes.has(item.type)

              return (
                <div key={item.type} className={`catalogue-widget-card ${isAdded ? 'is-added' : ''}`}>
                  <div className="catalogue-card-header">
                    <div className="catalogue-icon-wrap">{getWidgetIcon(item.type)}</div>
                    <div className="catalogue-title-wrap">
                      <h4 className="catalogue-card-label">{item.label}</h4>
                      <span className="catalogue-size-hint">
                        Grid size: {item.defaultPosition.w} cols × {item.defaultPosition.h} rows
                      </span>
                    </div>
                  </div>

                  <p className="catalogue-card-desc">{item.description}</p>

                  <div className="catalogue-card-footer">
                    {isAdded ? (
                      <button
                        type="button"
                        className="catalogue-btn added"
                        onClick={() => {
                          onAddWidget(item.type)
                          onClose()
                        }}
                        title="Add another instance of this widget"
                      >
                        <Check size={14} /> Add Another
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="catalogue-btn add"
                        onClick={() => {
                          onAddWidget(item.type)
                          onClose()
                        }}
                      >
                        <Plus size={14} /> Add Widget
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
