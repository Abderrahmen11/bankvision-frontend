import type { UserRole } from '@/types/user'

/* ── Branch Status Config ── */
export const BRANCH_STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: '✓',
  },
  inactive: {
    label: 'Inactive',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.25)',
    icon: '○',
  },
  under_renovation: {
    label: 'Under Renovation',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: '⚠',
  },
} as const

export type BranchStatus = keyof typeof BRANCH_STATUS_CONFIG

/* ── RBAC Permission Guards ── */
export function canCreateBranch(role?: UserRole): boolean {
  return role === 'admin'
}

export function canEditBranch(role?: UserRole): boolean {
  return role === 'admin'
}

export function canDeleteBranch(role?: UserRole): boolean {
  return role === 'admin'
}

export function isReadOnlyBranch(role?: UserRole): boolean {
  return role === 'analyst' || role === 'auditor' || role === 'compliance'
}

export function isOwnBranchOnly(role?: UserRole): boolean {
  return role === 'manager' || role === 'csr'
}

/* ── Formatters ── */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  return phone
}

/* ── CSV Export ── */
export function exportBranchesToCSV(
  data: Record<string, unknown>[],
  filename = 'branches_export'
) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""')
          return `"${val}"`
        })
        .join(',')
    ),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
