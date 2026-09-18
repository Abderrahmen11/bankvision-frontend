import { formatDateLocale } from '@/shared/utils'
import type { UserRole } from '@/shared/types/user'

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


/* ── Formatters ── */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDateLocale(dateStr)
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDateLocale(dateStr, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return dateStr
  }
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
