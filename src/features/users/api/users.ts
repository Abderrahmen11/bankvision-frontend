import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type { User } from '@/shared/types/user'

export interface UserListParams {
  search?: string
  role?: string
  status?: string
  branch_id?: number | string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface CreateUserPayload {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  role: string
  branch_id?: number | null
  status?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  password?: string
  role?: string
  branch_id?: number | null
  status?: string
}

/** Slim projection returned by GET /users/eligible-relationship-managers */
export interface EligibleManager {
  id: number
  name: string
  email: string
  role: string
}

export const usersApi = {
  list: async (params?: UserListParams): Promise<PaginatedResponse<User>> => {
    const res = await apiClient.get<{ data: User[]; links: unknown; meta: unknown }>('/users', { params })
    return res.data as PaginatedResponse<User>
  },

  get: async (id: number | string): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return res.data.data
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', payload)
    return res.data.data
  },

  update: async (id: number | string, payload: UpdateUserPayload): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, payload)
    return res.data.data
  },

  delete: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },

  resetPassword: async (id: number | string, password: string): Promise<void> => {
    await apiClient.put(`/users/${id}`, { password })
  },

  /**
   * List active CSR / Manager users eligible to be assigned as
   * relationship managers for the given branch.
   */
  listEligibleRelationshipManagers: async (branchId: number | string): Promise<EligibleManager[]> => {
    const res = await apiClient.get<{ data: EligibleManager[] }>(
      '/users/eligible-relationship-managers',
      { params: { branch_id: branchId } }
    )
    return res.data.data
  },
}
