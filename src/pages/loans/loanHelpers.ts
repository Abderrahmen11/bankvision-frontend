import type { LoanType, LoanStatus } from '@/types/loan'
import type { UserRole } from '@/types/user'

/* ── Loan Type Config ── */
export const LOAN_TYPE_CONFIG: Record<
  LoanType,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  mortgage: {
    label: 'Mortgage',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(2, 132, 199, 0.25)',
    icon: '🏠',
  },
  personal: {
    label: 'Personal',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
    icon: '👤',
  },
  auto: {
    label: 'Auto Loan',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: '🚗',
  },
  business: {
    label: 'Business',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: '💼',
  },
}

/* ── Loan Status Config ── */
export const LOAN_STATUS_CONFIG: Record<
  LoanStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pending Review',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  active: {
    label: 'Active',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  delinquent: {
    label: 'Delinquent',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.25)',
  },
  defaulted: {
    label: 'Defaulted',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  completed: {
    label: 'Paid in Full',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.25)',
  },
}

/* ── RBAC Permission Guards ── */
export function canApplyLoan(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function canApproveLoan(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function canUpdateLoan(role?: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

export function isReadOnlyRole(role?: UserRole): boolean {
  return role === 'csr' || role === 'analyst' || role === 'auditor'
}

export function isComplianceRole(role?: UserRole): boolean {
  return role === 'compliance'
}

/* ── Financial Calculations ── */

/**
 * Standard fixed-rate monthly payment formula:
 * M = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number {
  if (!principal || termMonths <= 0) return 0
  if (!annualInterestRate || annualInterestRate <= 0) {
    return principal / termMonths
  }

  const monthlyRate = annualInterestRate / 100 / 12
  const factor = Math.pow(1 + monthlyRate, termMonths)
  const monthly = (principal * (monthlyRate * factor)) / (factor - 1)
  return isNaN(monthly) ? 0 : monthly
}

/**
 * Total estimated interest payable over full term
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number
): number {
  const totalPaid = monthlyPayment * termMonths
  return Math.max(0, totalPaid - principal)
}

/**
 * Calculate repayment progress (0 - 100%)
 */
export function calculateRepaymentProgress(
  principal: number,
  outstanding: number
): number {
  if (!principal || principal <= 0) return 0
  const repaid = Math.max(0, principal - outstanding)
  const pct = (repaid / principal) * 100
  return Math.min(100, Math.max(0, Math.round(pct)))
}

export interface ScheduledPayment {
  paymentNumber: number
  dueDate: string
  paymentAmount: number
  principalPart: number
  interestPart: number
  remainingBalance: number
}

/**
 * Generate amortization schedule for upcoming payments
 */
export function generateAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  startDateStr: string,
  limit = 12
): ScheduledPayment[] {
  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, termMonths)
  const monthlyRate = annualInterestRate > 0 ? annualInterestRate / 100 / 12 : 0

  let balance = principal
  const schedule: ScheduledPayment[] = []
  const start = new Date(startDateStr || new Date())

  const totalPayments = Math.min(termMonths, limit)

  for (let i = 1; i <= totalPayments; i++) {
    if (balance <= 0) break
    const interestPart = balance * monthlyRate
    let principalPart = monthlyPayment - interestPart
    if (principalPart > balance) {
      principalPart = balance
    }
    balance = Math.max(0, balance - principalPart)

    const dueDate = new Date(start)
    dueDate.setMonth(dueDate.getMonth() + i)

    schedule.push({
      paymentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      paymentAmount: principalPart + interestPart,
      principalPart,
      interestPart,
      remainingBalance: balance,
    })
  }

  return schedule
}

/* ── Formatters ── */

export function formatCurrency(
  amount: number | string | undefined | null,
  currency = 'USD'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  if (isNaN(num)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPercent(rate: number | string | undefined | null): string {
  const num = typeof rate === 'string' ? parseFloat(rate) : (rate ?? 0)
  if (isNaN(num)) return '0.00%'
  return `${num.toFixed(2)}%`
}

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
