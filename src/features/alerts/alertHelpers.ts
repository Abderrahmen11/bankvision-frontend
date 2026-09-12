import type { AlertType, AlertSeverity, AlertStatus, Alert } from '@/features/alerts/types'
import type { UserRole } from '@/shared/types/user'

// ---------------------------------------------------------------------------
// RBAC Guards
// ---------------------------------------------------------------------------

export const canResolveAlert = (role: UserRole): boolean =>
  ['admin', 'compliance', 'manager'].includes(role)

export const canAssignAlert = (role: UserRole): boolean =>
  ['admin', 'compliance', 'manager'].includes(role)

export const isAlertReadOnly = (role: UserRole): boolean =>
  ['csr', 'analyst', 'auditor'].includes(role)

// ---------------------------------------------------------------------------
// Alert Type Config
// ---------------------------------------------------------------------------

export const ALERT_TYPE_CONFIG: Record<
  AlertType,
  { label: string; color: string; bg: string; icon: string }
> = {
  kyc_expiring: {
    label: 'KYC Expiring',
    color: 'var(--warning-400)',
    bg: 'rgba(245,158,11,0.13)',
    icon: '🪪',
  },
  kyc_expired: {
    label: 'KYC Expired',
    color: 'var(--danger-400)',
    bg: 'rgba(239,68,68,0.13)',
    icon: '🚫',
  },
  suspicious_transaction: {
    label: 'Suspicious Txn',
    color: 'var(--danger-400)',
    bg: 'rgba(239,68,68,0.13)',
    icon: '⚠️',
  },
  large_transaction: {
    label: 'Large Txn',
    color: 'var(--primary-400)',
    bg: 'rgba(99,102,241,0.12)',
    icon: '💰',
  },
  loan_delinquent: {
    label: 'Loan Delinquent',
    color: 'var(--warning-400)',
    bg: 'rgba(245,158,11,0.13)',
    icon: '📉',
  },
  defaulted_loan: {
    label: 'Defaulted Loan',
    color: 'var(--danger-400)',
    bg: 'rgba(239,68,68,0.13)',
    icon: '🔴',
  },
  aml_flag: {
    label: 'AML Flag',
    color: '#e11d48',
    bg: 'rgba(225,29,72,0.12)',
    icon: '🚨',
  },
  fraud_suspected: {
    label: 'Fraud Suspected',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.12)',
    icon: '🕵️',
  },
  account_dormant: {
    label: 'Account Dormant',
    color: 'var(--text-muted)',
    bg: 'rgba(148,163,184,0.12)',
    icon: '😴',
  },
  other: {
    label: 'Other',
    color: 'var(--text-secondary)',
    bg: 'rgba(99,102,241,0.08)',
    icon: '🔔',
  },
}

export const getAlertTypeConfig = (type: string) =>
  ALERT_TYPE_CONFIG[type as AlertType] ?? ALERT_TYPE_CONFIG.other

// ---------------------------------------------------------------------------
// Severity Config
// ---------------------------------------------------------------------------

export const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; color: string; bg: string; dotClass: string; priority: number }
> = {
  high: {
    label: 'High',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.13)',
    dotClass: 'dot-high',
    priority: 3,
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.13)',
    dotClass: 'dot-medium',
    priority: 2,
  },
  low: {
    label: 'Low',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.13)',
    dotClass: 'dot-low',
    priority: 1,
  },
}

export const getSeverityConfig = (severity: string) =>
  SEVERITY_CONFIG[severity as AlertSeverity] ?? SEVERITY_CONFIG.low

// ---------------------------------------------------------------------------
// Status Config
// ---------------------------------------------------------------------------

export const STATUS_CONFIG: Record<
  AlertStatus,
  { label: string; color: string; bg: string }
> = {
  open: {
    label: 'Open',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.13)',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.13)',
  },
  resolved: {
    label: 'Resolved',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.13)',
  },
}

export const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status as AlertStatus] ?? STATUS_CONFIG.open

// ---------------------------------------------------------------------------
// Alertable entity routing
// ---------------------------------------------------------------------------

export const getAlertableLink = (alertable?: Alert['alertable']): string | null => {
  if (!alertable) return null
  switch (alertable.type) {
    case 'Customer':
      return `/customers/${alertable.id}`
    case 'Account':
      return `/accounts/${alertable.id}`
    case 'Transaction':
      return `/transactions/${alertable.id}`
    case 'Loan':
      return `/loans/${alertable.id}`
    default:
      return null
  }
}

export const getAlertableLabel = (alertable?: Alert['alertable']): string => {
  if (!alertable) return '—'
  return `${alertable.type} #${alertable.id}`
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export const exportAlertsToCSV = (alerts: Alert[], filename = 'alerts-export'): void => {
  const headers = [
    'Alert Number',
    'Type',
    'Severity',
    'Status',
    'Description',
    'Assigned To',
    'Alertable Type',
    'Alertable ID',
    'Created At',
    'Resolved At',
  ]

  const rows = alerts.map((a) => [
    a.alert_number,
    getAlertTypeConfig(a.alert_type).label,
    a.severity,
    a.status,
    `"${(a.description ?? '').replace(/"/g, '""')}"`,
    a.assigned_to?.name ?? '',
    a.alertable?.type ?? '',
    a.alertable?.id ?? '',
    a.created_at ?? '',
    a.resolved_at ?? '',
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export const formatAlertDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const timeAgo = (dateStr?: string | null): string => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
