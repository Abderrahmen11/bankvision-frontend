import { formatDateLocale, formatMoney } from '@/shared/utils'
import type { AccountType, AccountStatus } from '@/features/accounts/types'
import type { UserRole } from '@/shared/types/user'



export const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; color: string; bg: string; border: string }
> = {
  savings: {
    label: 'Savings',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
  },
  checking: {
    label: 'Checking',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.25)',
  },
  business: {
    label: 'Business',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
}

/* ── Account Status Config ── */
export const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  active: {
    label: 'Active',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  frozen: {
    label: 'Frozen',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  closed: {
    label: 'Closed',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.25)',
  },
}

/* ── RBAC Permission Guards ── */
export function canOpenAccount(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'csr'
}

export function canEditAccount(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function canFreezeAccount(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'compliance'
}

export function canCloseAccount(role?: UserRole): boolean {
  return role === 'admin'
}

export function canViewAllBranches(role?: UserRole): boolean {
  return role === 'admin' || role === 'compliance' || role === 'auditor' || role === 'analyst'
}

/* ── Display Formatters ── */
export function formatCurrency(
  amount: number | string | undefined | null,
  _currency?: string
): string {
  // Fixed display currency: TND
  return formatMoney(amount)
}

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


export function getAvatarColor(seed: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#3b82f6',
    '#06b6d4', '#10b981', '#f59e0b', '#f43f5e',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/* ── CSV Export ── */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
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
