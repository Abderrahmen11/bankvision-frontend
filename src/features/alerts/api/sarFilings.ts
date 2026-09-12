import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type { CreateSarFilingPayload, SarFiling, SarFilingListParams } from '@/features/alerts/sarTypes'

/**
 * SAR Filings API Service — Suspicious Activity Report registry
 */
export const sarFilingsApi = {
  list: async (params?: SarFilingListParams): Promise<PaginatedResponse<SarFiling>> => {
    const res = await apiClient.get<{ data: SarFiling[]; links: unknown; meta: unknown }>(
      '/sar-filings',
      { params }
    )
    return res.data as PaginatedResponse<SarFiling>
  },

  create: async (payload: CreateSarFilingPayload): Promise<SarFiling> => {
    const res = await apiClient.post<ApiResponse<SarFiling>>('/sar-filings', payload)
    return res.data.data
  },
}
