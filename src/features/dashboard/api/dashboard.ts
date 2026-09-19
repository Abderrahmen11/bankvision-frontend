import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types/api'
import type {
  BackendDashboardLayout,
  DashboardLayoutData,
  DashboardStatsData,
  TransactionChartPoint,
  RecentActivityData,
  RiskAnalysisData,
} from '../types'
import type { ReportsData, ReportFilterParams } from '@/features/reports'

export const dashboardApi = {
  // Layout endpoints
  getLayout: async (): Promise<BackendDashboardLayout> => {
    const res = await apiClient.get<ApiResponse<BackendDashboardLayout>>('/dashboard/layout')
    return res.data.data
  },

  updateLayout: async (layoutData: DashboardLayoutData): Promise<BackendDashboardLayout> => {
    const res = await apiClient.put<ApiResponse<BackendDashboardLayout>>('/dashboard/layout', {
      layout_data: layoutData,
    })
    return res.data.data
  },

  resetLayout: async (): Promise<BackendDashboardLayout> => {
    const res = await apiClient.post<ApiResponse<BackendDashboardLayout>>('/dashboard/layout/reset')
    return res.data.data
  },

  // Data endpoints
  getStats: async (): Promise<DashboardStatsData> => {
    const res = await apiClient.get<ApiResponse<DashboardStatsData>>('/dashboard/stats')
    return res.data.data
  },

  getChartData: async (days = 30): Promise<TransactionChartPoint[]> => {
    const res = await apiClient.get<ApiResponse<TransactionChartPoint[]>>(`/dashboard/chart-data?days=${days}`)
    return res.data.data
  },

  getRecentActivity: async (limit = 10): Promise<RecentActivityData> => {
    const res = await apiClient.get<ApiResponse<RecentActivityData>>(`/dashboard/recent-activity?limit=${limit}`)
    return res.data.data
  },

  getRiskAnalysis: async (): Promise<RiskAnalysisData> => {
    const res = await apiClient.get<ApiResponse<RiskAnalysisData>>('/dashboard/risk-analysis')
    return res.data.data
  },

  getReports: async (params?: ReportFilterParams): Promise<ReportsData> => {
    const filtered = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      : {}
    const query = Object.keys(filtered).length > 0
      ? '?' + new URLSearchParams(filtered as Record<string, string>).toString()
      : ''
    const res = await apiClient.get<ApiResponse<ReportsData>>(`/dashboard/reports${query}`)
    return res.data.data
  },
}
