import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import type {
  DashboardStatsData,
  TransactionChartPoint,
  RecentActivityData,
  RiskAnalysisData,
} from '../types'
import type { ReportsData } from '@/features/reports'

interface HookResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
}

/**
 * Shared shape that adapts a TanStack Query result to the widget contract
 * (data / isLoading / error / refresh / lastUpdated). Keeps every widget
 * component unchanged while the fetching moves to React Query.
 */
export function useWidgetQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  refreshInterval = 0
): HookResult<T> & { refetch: () => Promise<void> } {
  const query = useQuery({
    queryKey,
    queryFn,
    refetchInterval: refreshInterval > 0 ? refreshInterval * 1000 : undefined,
  })

  const { refetch } = query

  const refresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refresh,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refetch: refresh,
  }
}

export function useStatsData(refreshInterval = 0) {
  return useWidgetQuery<DashboardStatsData>(
    ['dashboard', 'stats'],
    () => dashboardApi.getStats(),
    refreshInterval
  )
}

export function useChartData(days = 30, refreshInterval = 0) {
  return useWidgetQuery<TransactionChartPoint[]>(
    ['dashboard', 'chart-data', days],
    () => dashboardApi.getChartData(days),
    refreshInterval
  )
}

export function useRecentActivityData(limit = 10, refreshInterval = 0) {
  return useWidgetQuery<RecentActivityData>(
    ['dashboard', 'recent-activity', limit],
    () => dashboardApi.getRecentActivity(limit),
    refreshInterval
  )
}

export function useRiskAnalysisData(refreshInterval = 0) {
  return useWidgetQuery<RiskAnalysisData>(
    ['dashboard', 'risk-analysis'],
    () => dashboardApi.getRiskAnalysis(),
    refreshInterval
  )
}

export function useReportsData(refreshInterval = 0) {
  return useWidgetQuery<ReportsData>(
    ['dashboard', 'reports'],
    () => dashboardApi.getReports(),
    refreshInterval
  )
}
