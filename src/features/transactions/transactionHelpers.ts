import { formatDateLocale, formatMoney } from '@/shared/utils'
import type { TransactionType, TransactionStatus, TransactionChannel } from '@/features/transactions/types'
import type { UserRole } from '@/shared/types/user'



export const TX_TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  deposit: {
    label: 'Deposit',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: '↓',
  },
  withdrawal: {
    label: 'Withdrawal',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
    icon: '↑',
  },
  transfer: {
    label: 'Transfer',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
    icon: '⇄',
  },
  wire: {
    label: 'Wire',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
    icon: '⚡',
  },
}

/* ── Transaction Status Config ── */
export const TX_STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  completed: {
    label: 'Completed',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  flagged: {
    label: 'Flagged',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  failed: {
    label: 'Failed',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.25)',
  },
}

const CHANNEL_LABELS: Record<string, string> = {
  branch: 'Branch',
  atm:    'ATM',
  online: 'Online Banking',
  mobile: 'Mobile App',
  wire:   'Wire',
}

/* ── RBAC Permission Guards ── */
export function canApproveTransaction(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function canFlagTransaction(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'compliance'
}

export function canRecordTransaction(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'csr'
}


/* ── Amount Formatters ── */
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

/** Credit types — amount shown in green */
export function isCredit(type: string): boolean {
  return type === 'deposit'
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

/** Format large numbers compactly (e.g. 10000 → $10K) */
export function formatAmountCompact(amount: number | undefined | null): string {
  const num = amount ?? 0
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M DT`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K DT`
  return `${num.toFixed(0)} DT`
}

const HIGH_VALUE_THRESHOLD = 10_000

export function isHighValue(amount: number | string | undefined | null): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return !Number.isNaN(num) && num >= HIGH_VALUE_THRESHOLD
}


export function getChannelLabel(channel?: TransactionChannel | string | null): string {
  if (!channel) return '—'
  return CHANNEL_LABELS[channel] ?? channel
}
