import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type {
  Alert,
  AlertListParams,
  AssignAlertPayload,
} from '@/features/alerts/types'

export const alertsApi = {
  list: async (params?: AlertListParams): Promise<PaginatedResponse<Alert>> => {
    const res = await apiClient.get<{ data: Alert[]; links: unknown; meta: unknown }>(
      '/alerts',
      { params }
    )
    return res.data as PaginatedResponse<Alert>
  },

  get: async (id: number | string): Promise<Alert> => {
    const res = await apiClient.get<ApiResponse<Alert>>(`/alerts/${id}`)
    return res.data.data
  },

  resolve: async (id: number | string, notes?: string): Promise<Alert> => {
    const res = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/resolve`, { notes })
    return res.data.data
  },

  assign: async (id: number | string, payload: AssignAlertPayload): Promise<Alert> => {
    const res = await apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/assign`, payload)
    return res.data.data
  },
}
