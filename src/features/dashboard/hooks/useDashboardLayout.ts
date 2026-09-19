import { showToast } from '@/shared/hooks'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { UserRole } from '@/shared/types/user'
import type { DashboardWidgetConfig, WidgetType, WidgetSettings } from '../types'
import { dashboardApi } from '../api/dashboard'
import { getDefaultRoleLayout, getWidgetDefinition } from '../config/widgetRegistry'

const LOCAL_STORAGE_PREFIX = 'bankvision_dashboard_layout_'

/**
 * Drop widgets the current role may not use (e.g. system_health is visible to
 * admin/auditor only — its data endpoint is admin-only). Unknown types that
 * are not in the registry are dropped as well, since they cannot render.
 */
function filterWidgetsForRole(widgets: DashboardWidgetConfig[], role: UserRole): DashboardWidgetConfig[] {
  return widgets.filter((w) => {
    const def = getWidgetDefinition(w.type)
    return def !== null && def.allowedRoles.includes(role)
  })
}

export function useDashboardLayout(role: UserRole) {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${role}`)
      if (cached) {
        return filterWidgetsForRole(JSON.parse(cached), role)
      }
    } catch {
      // fallback
    }
    return getDefaultRoleLayout(role)
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isDefault, setIsDefault] = useState<boolean>(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch layout from backend API on mount or role change
  const fetchLayout = useCallback(async () => {
    setIsLoading(true)
    try {
      const backendLayout = await dashboardApi.getLayout()
      if (backendLayout?.layout_data?.widgets && backendLayout.layout_data.widgets.length > 0) {
        setWidgets(filterWidgetsForRole(backendLayout.layout_data.widgets, role))
        setIsDefault(backendLayout.is_default)
        try {
          localStorage.setItem(
            `${LOCAL_STORAGE_PREFIX}${role}`,
            JSON.stringify(backendLayout.layout_data.widgets)
          )
        } catch {
          // ignore storage error
        }
      } else {
        const defaults = getDefaultRoleLayout(role)
        setWidgets(defaults)
        setIsDefault(true)
      }
    } catch (err) {
      console.warn('Backend layout fetch failed, using local/default layout:', err)
      // Fallback to local storage or defaults
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${role}`)
        if (cached) {
          setWidgets(filterWidgetsForRole(JSON.parse(cached), role))
        } else {
          setWidgets(getDefaultRoleLayout(role))
        }
      } catch {
        setWidgets(getDefaultRoleLayout(role))
      }
    } finally {
      setIsLoading(false)
    }
  }, [role])

  useEffect(() => {
    const timer = setTimeout(() => { void fetchLayout() }, 0)
    return () => clearTimeout(timer)
  }, [fetchLayout])

  // Persist layout to backend and localStorage
  const persistLayout = useCallback(
    async (newWidgets: DashboardWidgetConfig[], notify = false) => {
      setIsSaving(true)
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${role}`, JSON.stringify(newWidgets))
        await dashboardApi.updateLayout({
          columns: 12,
          theme: 'glassmorphism',
          widgets: newWidgets,
        })
        setIsDefault(false)
        showToast.success(
          notify
            ? 'Dashboard layout saved successfully.'
            : 'Dashboard layout saved.'
        )
      } catch (err) {
        console.error('Failed to save layout to backend:', err)
        showToast.error('Layout saved locally, but server update failed.')
      } finally {
        setIsSaving(false)
      }
    },
    [role]
  )

  // Auto-debounced save when widgets change through drag/resize
  const queueAutoSave = useCallback(
    (newWidgets: DashboardWidgetConfig[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        persistLayout(newWidgets, false)
      }, 1200)
    },
    [persistLayout]
  )

  // Update positions from react-grid-layout changes
  const updateWidgetPositions = useCallback(
    (newPositions: readonly { i: string; x: number; y: number; w: number; h: number }[]) => {
      setWidgets((prevWidgets) => {
        let changed = false
        const updated = prevWidgets.map((w) => {
          const matched = newPositions.find((pos) => pos.i === w.id)
          if (
            matched &&
            (w.position.x !== matched.x ||
              w.position.y !== matched.y ||
              w.position.w !== matched.w ||
              w.position.h !== matched.h)
          ) {
            changed = true
            return {
              ...w,
              position: {
                ...w.position,
                x: matched.x,
                y: matched.y,
                w: matched.w,
                h: matched.h,
              },
            }
          }
          return w
        })

        if (changed) {
          queueAutoSave(updated)
          return updated
        }
        return prevWidgets
      })
    },
    [queueAutoSave]
  )

  // Add a new widget to the grid
  const addWidget = useCallback(
    (type: WidgetType) => {
      const def = getWidgetDefinition(type)
      if (!def) return

      const uniqueId = `widget-${type}-${Date.now().toString().slice(-4)}`
      // Calculate next available y position
      const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 0)

      const newWidget: DashboardWidgetConfig = {
        id: uniqueId,
        type,
        title: def.defaultTitle,
        visible: true,
        position: {
          x: 0,
          y: maxY,
          w: def.defaultPosition.w,
          h: def.defaultPosition.h,
          minW: def.defaultPosition.minW,
          minH: def.defaultPosition.minH,
        },
        settings: { ...def.defaultSettings },
      }

      const updated = [...widgets, newWidget]
      setWidgets(updated)
      persistLayout(updated, true)
      showToast.success(`Added "${def.label}" to dashboard.`)
    },
    [widgets, persistLayout]
  )

  // Remove widget from the grid
  const removeWidget = useCallback(
    (id: string) => {
      const target = widgets.find((w) => w.id === id)
      const updated = widgets.filter((w) => w.id !== id)
      setWidgets(updated)
      persistLayout(updated, true)
      showToast.info(`Removed "${target?.title || 'widget'}" from dashboard.`)
    },
    [widgets, persistLayout]
  )

  // Update specific widget settings & title
  const updateWidgetSettings = useCallback(
    (id: string, settings: WidgetSettings, title?: string) => {
      const updated = widgets.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            title: title !== undefined ? title : w.title,
            settings: { ...w.settings, ...settings },
          }
        }
        return w
      })
      setWidgets(updated)
      persistLayout(updated, true)
      showToast.success('Widget settings updated.')
    },
    [widgets, persistLayout]
  )

  // Reset to default role layout
  const resetLayout = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await dashboardApi.resetLayout()
      if (res?.layout_data?.widgets) {
        setWidgets(res.layout_data.widgets)
      } else {
        setWidgets(getDefaultRoleLayout(role))
      }
      setIsDefault(true)
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${role}`)
      showToast.success('Dashboard layout restored to role default.')
    } catch (err) {
      console.warn('Backend reset failed, resetting locally:', err)
      const defaults = getDefaultRoleLayout(role)
      setWidgets(defaults)
      setIsDefault(true)
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${role}`)
      showToast.info('Dashboard layout reset to local default.')
    } finally {
      setIsSaving(false)
    }
  }, [role])

  return {
    widgets,
    isLoading,
    isSaving,
    isDefault,
    updateWidgetPositions,
    addWidget,
    removeWidget,
    updateWidgetSettings,
    resetLayout,
    refreshLayout: fetchLayout,
  }
}
