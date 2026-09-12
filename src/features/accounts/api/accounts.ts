import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type {
  BankAccount,
  AccountListParams,
  OpenAccountPayload,
  UpdateAccountPayload,
} from '@/features/accounts/types'

export const accountsApi = {
  list: async (params?: AccountListParams): Promise<PaginatedResponse<BankAccount>> => {
    const res = await apiClient.get<{ data: BankAccount[]; links: unknown; meta: unknown }>(
      '/accounts',
      { params }
    )
    return res.data as PaginatedResponse<BankAccount>
  },

  get: async (id: number | string): Promise<BankAccount> => {
    const res = await apiClient.get<ApiResponse<BankAccount>>(`/accounts/${id}`)
    return res.data.data
  },

  open: async (payload: OpenAccountPayload): Promise<BankAccount> => {
    const res = await apiClient.post<ApiResponse<BankAccount>>('/accounts', payload)
    return res.data.data
  },

  update: async (id: number | string, payload: UpdateAccountPayload): Promise<BankAccount> => {
    const res = await apiClient.put<ApiResponse<BankAccount>>(`/accounts/${id}`, payload)
    return res.data.data
  },

  close: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`)
  },

  transactions: async (
    id: number | string,
    params?: { type?: string; status?: string; date_from?: string; date_to?: string; page?: number }
  ) => {
    const res = await apiClient.get(`/accounts/${id}/transactions`, { params })
    return res.data
  },
}
