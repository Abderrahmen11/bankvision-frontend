import { formatDateLocale, formatMoney } from '@/shared/utils'
import type { CustomerType, KycStatus, RiskLevel } from '@/features/customers/types'
import type { UserRole } from '@/shared/types/user'

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  premium: 'Premium Banking',
  regular: 'Standard Retail',
  business: 'Commercial Business',
}

export const KYC_STATUS_CONFIG: Record<
  KycStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  verified: {
    label: 'Verified',
    color: 'var(--success-500, #10b981)',
    bg: 'var(--success-50, rgba(16, 185, 129, 0.12))',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  pending: {
    label: 'Pending Review',
    color: 'var(--warning-500, #f59e0b)',
    bg: 'var(--warning-50, rgba(245, 158, 11, 0.12))',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  expired: {
    label: 'Expired',
    color: 'var(--danger-500, #f43f5e)',
    bg: 'var(--danger-50, rgba(244, 63, 94, 0.12))',
    border: 'rgba(244, 63, 94, 0.25)',
  },
}

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string }
> = {
  low: {
    label: 'Low Risk',
    color: 'var(--success-500, #10b981)',
    bg: 'var(--success-50, rgba(16, 185, 129, 0.12))',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  medium: {
    label: 'Medium Risk',
    color: 'var(--warning-500, #f59e0b)',
    bg: 'var(--warning-50, rgba(245, 158, 11, 0.12))',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  high: {
    label: 'High Risk',
    color: 'var(--danger-500, #f43f5e)',
    bg: 'var(--danger-50, rgba(244, 63, 94, 0.12))',
    border: 'rgba(244, 63, 94, 0.25)',
  },
}

/* ── Role Ability Matrix ── */
export function canCreateCustomer(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'csr'
}

export function canEditCustomer(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'csr' || role === 'compliance'
}

export function canDeleteCustomer(role?: UserRole): boolean {
  return role === 'admin'
}

export function canEditPersonalInfo(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'csr'
}

export function canEditKyc(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'compliance'
}

export function canEditRisk(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function canChangeBranch(role?: UserRole): boolean {
  return role === 'admin'
}

/* ── Display Formatters ── */
export function formatCurrency(
  amount: number | string | undefined | null
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

export function getInitials(name: string): string {
  if (!name) return 'CU'
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(name: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#3b82f6',
    '#06b6d4', '#10b981', '#f59e0b', '#f43f5e',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
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
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
