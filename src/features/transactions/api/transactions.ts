import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type {
  Transaction,
  TransactionListParams,
  RecordTransactionPayload,
} from '@/features/transactions/types'

export const transactionsApi = {
  list: async (params?: TransactionListParams): Promise<PaginatedResponse<Transaction>> => {
    const res = await apiClient.get<{ data: Transaction[]; links: unknown; meta: unknown }>(
      '/transactions',
      { params }
    )
    return res.data as PaginatedResponse<Transaction>
  },

  get: async (id: number | string): Promise<Transaction> => {
    const res = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`)
    return res.data.data
  },

  record: async (payload: RecordTransactionPayload): Promise<Transaction> => {
    const res = await apiClient.post<ApiResponse<Transaction>>('/transactions', payload)
    return res.data.data
  },

  approve: async (id: number | string): Promise<Transaction> => {
    const res = await apiClient.post<ApiResponse<Transaction>>(`/transactions/${id}/approve`)
    return res.data.data
  },

  flag: async (id: number | string): Promise<Transaction> => {
    const res = await apiClient.post<ApiResponse<Transaction>>(`/transactions/${id}/flag`)
    return res.data.data
  },
}
