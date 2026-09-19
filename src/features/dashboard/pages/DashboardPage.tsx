import { useAuth } from '@/shared/hooks'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ResponsiveGridLayout, useContainerWidth, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './DashboardPage.css'

import type { UserRole } from '@/shared/types/user'
import { useDashboardLayout } from '../hooks/useDashboardLayout'
import type { DashboardWidgetConfig, WidgetType, WidgetSettings } from '../types'

// Widgets
import { StatsWidget } from '../components/StatsWidget'
import { TransactionChartWidget } from '../components/TransactionChartWidget'
import { AlertsPanelWidget } from '../components/AlertsPanelWidget'
import { RecentTransactionsWidget } from '../components/RecentTransactionsWidget'
import { AccountDistributionWidget } from '../components/AccountDistributionWidget'
import { LoanPortfolioWidget } from '../components/LoanPortfolioWidget'
import { TopBranchesWidget } from '../components/TopBranchesWidget'
import { SystemHealthWidget } from '../components/SystemHealthWidget'
import { ComplianceWidget } from '../components/ComplianceWidget'

// Modals
import { AddWidgetModal } from '../modals/AddWidgetModal'
import { WidgetSettingsModal } from '../modals/WidgetSettingsModal'

import { Plus, RotateCcw, Check, Sparkles } from 'lucide-react'

/** Breakpoints whose layouts are persisted when the user drags/resizes. */
const PERSISTED_BREAKPOINTS = new Set(['lg', 'md'])

/** Column counts per breakpoint - must match the `cols` prop. */
const COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

export const DashboardPage: React.FC = () => {
  const { role } = useAuth()
  const activeRole: UserRole = role || 'csr'
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 })

  const {
    widgets,
    isLoading: isLayoutLoading,
    isSaving,
    isDefault,
    updateWidgetPositions,
    addWidget,
    removeWidget,
    updateWidgetSettings,
    resetLayout,
  } = useDashboardLayout(activeRole)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeSettingsWidget, setActiveSettingsWidget] = useState<DashboardWidgetConfig | null>(null)

  // Below 768px the grid renders the derived stacked layout and drag/resize are off.
  const isMobile = width < 768
  // Drag/resize only on breakpoints whose layouts persist (md/lg ≥996px). On
  // sm–xxs the grid renders a derived stacked layout with nothing to hand-edit.
  const dragResizeEnabled = width >= 996

  /** Tracks the active RGL breakpoint so layout persistence only happens on desktop. */
  const activeBreakpointRef = useRef<string>('lg')

  // Map widget configs to react-grid-layout items (the saved, desktop-authored layout)
  const currentLayout = useMemo(() => {
    return widgets.map((w) => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: w.position.minW || 3,
      minH: w.position.minH || 3,
      maxW: w.position.maxW,
      maxH: w.position.maxH,
    }))
  }, [widgets])

  /**
   * Derive a stacked single/two-column layout for small breakpoints instead of
   * letting RGL compact the saved desktop layout - and never persist the
   * derived result. Widgets keep their saved order (y, then x) and every row
   * spans the full breakpoint width, so resize-down → resize-up is lossless.
   */
  const deriveStackedLayout = useCallback(
    (breakpoint: string): Layout => {
      const cols = COLS[breakpoint] ?? 12
      const ordered = [...currentLayout].sort((a, b) => a.y - b.y || a.x - b.x)
      let cursorY = 0
      return ordered.map((item) => {
        const placed = {
          ...item,
          x: 0,
          y: cursorY,
          w: cols,
          minW: undefined,
          maxW: undefined,
        }
        cursorY += item.h
        return placed
      })
    },
    [currentLayout]
  )

  /**
   * md (996–1199px, 10 columns) reuses the widget's saved md arrangement when
   * the user customized it there, otherwise RGL fits the 12-column desktop
   * layout into 10 columns. Either way the saved desktop positions are never
   * modified, so growing back to lg restores them exactly.
   */
  const mdLayout = useMemo(() => {
    return widgets.map((w) => {
      const item = {
        i: w.id,
        x: w.position.x,
        y: w.position.y,
        w: w.position.w,
        h: w.position.h,
        minW: w.position.minW || 3,
        minH: w.position.minH || 3,
        maxW: w.position.maxW,
        maxH: w.position.maxH,
      }
      if (w.position.md) {
        return { ...item, x: w.position.md.x, y: w.position.md.y, w: w.position.md.w, h: w.position.md.h }
      }
      return item
    })
  }, [widgets])

  const layouts = useMemo(() => {
    return {
      lg: currentLayout,
      md: mdLayout,
      sm: deriveStackedLayout('sm'),
      xs: deriveStackedLayout('xs'),
      xxs: deriveStackedLayout('xxs'),
    }
  }, [currentLayout, mdLayout, deriveStackedLayout])

  /**
   * Persist only when the change happened on a desktop breakpoint. Changes on
   * sm/xs/xxs (drag/resize disabled there anyway) must never overwrite the
   * saved desktop arrangement. md writes go to the dedicated md position so
   * the 12-column desktop layout stays intact.
   */
  const handleLayoutChange = useCallback(
    (layout: Layout, allLayouts: Partial<Record<string, Layout>>) => {
      const breakpoint = activeBreakpointRef.current
      if (!PERSISTED_BREAKPOINTS.has(breakpoint)) return
      const source = allLayouts?.[breakpoint] ?? layout
      if (source && source.length > 0) {
        updateWidgetPositions(source, breakpoint as 'lg' | 'md')
      }
    },
    [updateWidgetPositions]
  )

  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    activeBreakpointRef.current = newBreakpoint
  }, [])

  // Render widget content by type
  const renderWidgetContent = (widget: DashboardWidgetConfig) => {
    const handleSettings = () => setActiveSettingsWidget(widget)
    const handleRemove = () => removeWidget(widget.id)

    switch (widget.type) {
      case 'stats':
        return <StatsWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'transaction_chart':
        return <TransactionChartWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'alerts_panel':
        return <AlertsPanelWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'recent_transactions':
        return <RecentTransactionsWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'account_distribution':
        return <AccountDistributionWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'loan_portfolio':
        return <LoanPortfolioWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'top_branches':
        return <TopBranchesWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'system_health':
        return <SystemHealthWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      case 'compliance':
        return <ComplianceWidget widget={widget} onSettings={handleSettings} onRemove={handleRemove} />
      default:
        return null
    }
  }

  return (
    <div className="dashboard-page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Dashboard Sub-Header & Modular Controls */}
      <div className="dashboard-page-header">
        <div className="dashboard-header-title-wrap">
          <h1>
            <Sparkles size={20} className="text-primary-400" />
            Executive Workspace
          </h1>
          <p className="dashboard-header-subtitle">
            Modular, draggable, and resizable analytics widgets configured for{' '}
            <strong style={{ color: 'var(--primary-400)', textTransform: 'capitalize' }}>{activeRole}</strong>.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {isSaving ? (
            <span className="dashboard-saving-tag">
              <span className="pulsing-health-dot" style={{ width: 6, height: 6 }} />
              Saving layout...
            </span>
          ) : !isDefault ? (
            <span className="dashboard-saving-tag" title="Your layout adjustments are saved automatically">
              <Check size={12} className="text-emerald-400" />
              Customized Layout
            </span>
          ) : null}

          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={resetLayout}
            title="Revert all widgets to the default configuration for this role"
          >
            <RotateCcw size={14} />
            Reset Layout
          </button>

          <button
            type="button"
            className="dashboard-btn dashboard-btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            Add Widget
          </button>
        </div>
      </div>

      {/* Dynamic Drag-and-Drop Responsive Grid Layout */}
      <div className={`dashboard-grid-wrapper ${isMobile ? 'mobile-stack' : ''}`} ref={containerRef}>
        {mounted && width > 0 && !isLayoutLoading && (
          <ResponsiveGridLayout
            width={width}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={COLS}
            rowHeight={60}
            margin={[16, 16]}
            onBreakpointChange={handleBreakpointChange}
            onLayoutChange={handleLayoutChange}
            dragConfig={{
              enabled: dragResizeEnabled,
              bounded: false,
              // Entire widget header acts as the drag handle; header action
              // buttons (refresh/settings/fullscreen/remove) are excluded.
              handle: '.widget-header',
              cancel: '.widget-actions, .widget-actions *, .widget-action-btn',
              threshold: 3,
            }}
            resizeConfig={{
              enabled: dragResizeEnabled,
              // Resizable from every corner and edge
              handles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'],
            }}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="grid-widget-item-wrap">
                {renderWidgetContent(widget)}
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWidget={(type: WidgetType) => addWidget(type)}
        currentWidgets={widgets}
        role={activeRole}
      />

      {/* Widget Settings Modal */}
      <WidgetSettingsModal
        isOpen={Boolean(activeSettingsWidget)}
        widget={activeSettingsWidget}
        onClose={() => setActiveSettingsWidget(null)}
        onSave={(id: string, settings: WidgetSettings, title: string) => {
          updateWidgetSettings(id, settings, title)
          setActiveSettingsWidget(null)
        }}
      />
    </div>
  )
}
