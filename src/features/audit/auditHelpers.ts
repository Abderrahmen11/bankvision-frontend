/**
 * Audit Logs helpers — labels, colors, formatting, and exports
 */
import type { AuditLog } from '@/features/audit/types'

// ─── Actions ─────────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'approve',
  'flag',
  'login',
  'logout',
] as const

const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  create:  { label: 'Create',  color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  update:  { label: 'Update',  color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  delete:  { label: 'Delete',  color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  approve: { label: 'Approve', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  flag:    { label: 'Flag',    color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  login:   { label: 'Login',   color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  logout:  { label: 'Logout',  color: '#64748b', bg: 'rgba(100, 116, 139, 0.14)' },
}

export function getActionMeta(action: string): { label: string; color: string; bg: string } {
  return (
    ACTION_META[action] ?? { label: titleCase(action), color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' }
  )
}

// ─── Resources ───────────────────────────────────────────────────────────────

export const AUDIT_RESOURCES = [
  'users',
  'branches',
  'customers',
  'accounts',
  'transactions',
  'loans',
  'alerts',
  'user_settings',
  'system_settings',
  'dashboard_layouts',
  'audit_logs',
] as const

const RESOURCE_LABELS: Record<string, string> = {
  users: 'Staff Users',
  branches: 'Branches',
  customers: 'Customers',
  accounts: 'Accounts',
  transactions: 'Transactions',
  loans: 'Loans',
  alerts: 'KYC/AML Alerts',
  user_settings: 'User Settings',
  system_settings: 'System Settings',
  dashboard_layouts: 'Dashboard Layouts',
  audit_logs: 'Audit Logs',
}

export function getResourceLabel(table: string | null): string {
  if (!table) return '—'
  return RESOURCE_LABELS[table] ?? titleCase(table)
}

/** Map a resource table to its frontend detail route, if one exists. */
export function getResourceRoute(log: AuditLog): string | null {
  const id = log.record_id
  if (id === null || id === undefined) return null
  const map: Record<string, string> = {
    users: '/users',
    customers: '/customers',
    accounts: '/accounts',
    transactions: '/transactions',
    loans: '/loans',
    alerts: '/alerts',
    branches: '/branches',
  }
  return map[log.table_name ?? ''] ? `${map[log.table_name ?? '']}/${id}` : null
}

// ─── User roles (filter options) ─────────────────────────────────────────────

export const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Branch Manager' },
  { value: 'compliance', label: 'Compliance Officer' },
  { value: 'analyst', label: 'Financial Analyst' },
  { value: 'csr', label: 'Customer Service Rep' },
  { value: 'auditor', label: 'Internal Auditor' },
]

// ─── Formatting ──────────────────────────────────────────────────────────────

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function formatAuditTimestamp(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z')
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatRelativeTime(value: string | null): string {
  if (!value) return '—'
  const then = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z')
  const diffMs = Date.now() - then.getTime()
  if (Number.isNaN(diffMs)) return value
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatAuditTimestamp(value)
}

/** Count changed fields between old and new value sets. */
function countChanges(log: AuditLog): number {
  const keys = new Set([...Object.keys(log.old_values ?? {}), ...Object.keys(log.new_values ?? {})])
  let changed = 0
  for (const key of keys) {
    if (JSON.stringify((log.old_values ?? {})[key]) !== JSON.stringify((log.new_values ?? {})[key])) {
      changed++
    }
  }
  return changed
}

/** Human readable summary of the change set, e.g. "3 fields changed" / "created". */
export function changesSummary(log: AuditLog): string {
  const hasOld = log.old_values && Object.keys(log.old_values).length > 0
  const hasNew = log.new_values && Object.keys(log.new_values).length > 0
  if (!hasOld && !hasNew) return '—'
  if (!hasOld && hasNew) return `${Object.keys(log.new_values!).length} field(s) set`
  const changed = countChanges(log)
  return changed > 0 ? `${changed} field(s) changed` : 'No field changes'
}

// ─── Exports ─────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function exportAuditLogsToCsv(logs: AuditLog[], filename = `bankvision-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`): void {
  const header = ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Record ID', 'IP Address', 'Changes']
  const rows = logs.map((log) =>
    [
      formatAuditTimestamp(log.created_at),
      log.user?.name ?? 'System',
      log.user?.role ?? 'system',
      getActionMeta(log.action).label,
      getResourceLabel(log.table_name),
      log.record_id ?? '',
      log.ip_address ?? '',
      changesSummary(log),
    ].map(csvCell).join(',')
  )
  downloadFile([header.map(csvCell).join(','), ...rows].join('\n'), filename, 'text/csv;charset=utf-8;')
}

function xmlCell(value: unknown): string {
  const type = typeof value === 'number' ? 'Number' : 'String'
  const text = String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<Cell><Data ss:Type="${type}">${text}</Data></Cell>`
}

export function exportAuditLogsToExcel(logs: AuditLog[], filename = `bankvision-audit-logs-${new Date().toISOString().slice(0, 10)}.xls`): void {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Audit Logs">
    <Table>
      ${['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Record ID', 'IP Address', 'Changes']
        .map((h) => xmlCell(h))
        .join('')}
      ${logs
        .map(
          (log) =>
            `<Row>${[
              formatAuditTimestamp(log.created_at),
              log.user?.name ?? 'System',
              log.user?.role ?? 'system',
              getActionMeta(log.action).label,
              getResourceLabel(log.table_name),
              String(log.record_id ?? ''),
              log.ip_address ?? '',
              changesSummary(log),
            ]
              .map(xmlCell)
              .join('')}</Row>`
        )
        .join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`
  downloadFile(xml, filename, 'application/vnd.ms-excel')
}
