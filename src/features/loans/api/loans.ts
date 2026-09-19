import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type {
  Loan,
  LoanListParams,
  ApplyLoanPayload,
  UpdateLoanPayload,
} from '@/features/loans/types'

export const loansApi = {
  list: async (params?: LoanListParams): Promise<PaginatedResponse<Loan>> => {
    const res = await apiClient.get<{ data: Loan[]; links: unknown; meta: unknown }>(
      '/loans',
      { params }
    )
    return res.data as PaginatedResponse<Loan>
  },

  get: async (id: number | string): Promise<Loan> => {
    const res = await apiClient.get<ApiResponse<Loan>>(`/loans/${id}`)
    return res.data.data
  },

  apply: async (payload: ApplyLoanPayload): Promise<Loan> => {
    const res = await apiClient.post<ApiResponse<Loan>>('/loans', payload)
    return res.data.data
  },

  update: async (id: number | string, payload: UpdateLoanPayload): Promise<Loan> => {
    const res = await apiClient.put<ApiResponse<Loan>>(`/loans/${id}`, payload)
    return res.data.data
  },

  approve: async (id: number | string): Promise<Loan> => {
    const res = await apiClient.post<ApiResponse<Loan>>(`/loans/${id}/approve`)
    return res.data.data
  },
}
