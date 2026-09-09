import type { UserRole } from '@/types/user'

// ─── Currency & Number Formatters ───────────────────────────────────────────

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      return '$' + (value / 1_000_000_000).toFixed(2) + 'B'
    }
    if (Math.abs(value) >= 1_000_000) {
      return '$' + (value / 1_000_000).toFixed(2) + 'M'
    }
    if (Math.abs(value) >= 1_000) {
      return '$' + (value / 1_000).toFixed(1) + 'K'
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B'
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1) + 'K'
  return value.toLocaleString()
}

export function formatPercent(value: number, decimals = 2): string {
  return value.toFixed(decimals) + '%'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ─── Period Presets ───────────────────────────────────────────────────────────

export interface PeriodPreset {
  label: string
  value: '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all'
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  { label: 'Last 7 Days',    value: '7d'  },
  { label: 'Last 30 Days',   value: '30d' },
  { label: 'Last 90 Days',   value: '90d' },
  { label: 'Last 12 Months', value: '1y'  },
  { label: 'Year to Date',   value: 'ytd' },
  { label: 'All Time',       value: 'all' },
]

// ─── RBAC Tab Guards ──────────────────────────────────────────────────────────

export type ReportTab = 'overview' | 'financial' | 'transactions' | 'loans' | 'risk'

export interface TabConfig {
  id: ReportTab
  label: string
  icon: string
  allowedRoles: UserRole[]
  description: string
}

export const REPORT_TABS: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'layout-dashboard',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor', 'compliance'],
    description: 'Executive KPI summary and financial snapshot',
  },
  {
    id: 'financial',
    label: 'Financial Reports',
    icon: 'landmark',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor'],
    description: 'Income Statement, Balance Sheet, Cash Flow, Branch Performance',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'bar-chart-3',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor', 'compliance'],
    description: 'Transaction volume, channel distribution, trends, and high-value transactions',
  },
  {
    id: 'loans',
    label: 'Loan Portfolio',
    icon: 'credit-card',
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor'],
    description: 'Loan portfolio performance, NPL analysis, delinquency trends',
  },
  {
    id: 'risk',
    label: 'Risk & Compliance',
    icon: 'shield-alert',
    allowedRoles: ['admin', 'analyst', 'auditor', 'compliance', 'manager'],
    description: 'Customer risk distribution, KYC/AML compliance status, branch risk',
  },
]

export function getAllowedTabs(role: UserRole): TabConfig[] {
  return REPORT_TABS.filter(tab => tab.allowedRoles.includes(role))
}

export function canAccessReports(role: UserRole): boolean {
  return role !== 'csr'
}

// ─── Chart Colors ─────────────────────────────────────────────────────────────

export const CHART_COLORS = {
  primary:   '#6366f1',
  success:   '#10b981',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  info:      '#3b82f6',
  purple:    '#a855f7',
  teal:      '#14b8a6',
  orange:    '#f97316',
  pink:      '#ec4899',
  gray:      '#6b7280',
}

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
]

export const RISK_COLORS: Record<string, string> = {
  high:   CHART_COLORS.danger,
  medium: CHART_COLORS.warning,
  low:    CHART_COLORS.success,
}

export const STATUS_COLORS: Record<string, string> = {
  active:      CHART_COLORS.success,
  pending:     CHART_COLORS.warning,
  rejected:    CHART_COLORS.danger,
  delinquent:  '#f97316',
  defaulted:   CHART_COLORS.danger,
  approved:    CHART_COLORS.success,
}
