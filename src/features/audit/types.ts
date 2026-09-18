/**
 * Audit Log Type Definitions for BankVision
 */

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'flag'
  | 'login'
  | 'logout'
  | (string & {})

interface AuditLogUser {
  id: number
  name: string
  email: string
  role: string
  status?: string
  avatar?: string | null
  avatar_url?: string | null
  branch_id?: number | null
  branch?: { id: number; branch_name: string } | null
}

export interface AuditLog {
  id: number
  user_id?: number | null
  user?: AuditLogUser | null
  action: AuditAction
  table_name: string | null
  record_id?: number | string | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  /** Legacy optional fields retained for defensive consumers. */
  event?: string
  auditable_type?: string | null
  auditable_id?: number | null
  url?: string | null
}

export interface AuditLogListParams {
  search?: string
  action?: string
  table_name?: string
  user_id?: number | string
  record_id?: number | string
  ip_address?: string
  role?: string
  date_from?: string
  date_to?: string
  sort_by?: 'created_at' | 'action' | 'table_name' | 'record_id' | 'ip_address'
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
