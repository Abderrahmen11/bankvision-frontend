import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type { Branch } from '@/shared/types/user'

export interface BranchListParams {
  search?: string
  city?: string
  status?: string
  sort_by?: 'branch_name' | 'branch_code' | 'city' | 'created_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface CreateBranchPayload {
  branch_code: string
  branch_name: string
  address?: string
  city?: string
  phone?: string
  manager_id?: number | null
  status?: 'active' | 'inactive' | 'under_renovation'
}

export interface UpdateBranchPayload {
  branch_code?: string
  branch_name?: string
  address?: string
  city?: string
  phone?: string
  manager_id?: number | null
  status?: 'active' | 'inactive' | 'under_renovation'
}

export const branchesApi = {
  list: async (params?: BranchListParams): Promise<PaginatedResponse<Branch>> => {
    const res = await apiClient.get<{ data: Branch[]; links: unknown; meta: unknown }>('/branches', {
      params: { per_page: 15, ...params },
    })
    return res.data as PaginatedResponse<Branch>
  },

  get: async (id: number | string): Promise<Branch> => {
    const res = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`)
    return res.data.data
  },

  create: async (payload: CreateBranchPayload): Promise<Branch> => {
    const res = await apiClient.post<ApiResponse<Branch>>('/branches', payload)
    return res.data.data
  },

  update: async (id: number | string, payload: UpdateBranchPayload): Promise<Branch> => {
    const res = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, payload)
    return res.data.data
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`)
  },
}
