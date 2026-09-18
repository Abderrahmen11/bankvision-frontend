import { apiClient } from '@/shared/api/client'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type { AuditLog, AuditLogListParams } from '@/features/audit/types'

// Re-export the feature types for consumers of this API module.
export type { AuditLog, AuditLogListParams } from '@/features/audit/types'

export const auditLogsApi = {
  /**
   * Paginated audit trail with search, filters, sorting, and role-based scoping.
   */
  list: async (params?: AuditLogListParams): Promise<PaginatedResponse<AuditLog>> => {
    const res = await apiClient.get<{ data: AuditLog[]; links: unknown; meta: unknown }>(
      '/audit-logs',
      { params }
    )
    return res.data as PaginatedResponse<AuditLog>
  },

  /**
   * Single audit entry with full before/after values and user details.
   */
  get: async (id: number | string): Promise<AuditLog> => {
    const res = await apiClient.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`)
    return res.data.data
  },
}
