import type { User } from '@/shared/types/user'

/**
 * alert_type values that actually exist in the data:
 *  - Runtime-created (TransactionService/LoanService): suspicious_transaction,
 *    delinquent_loan, defaulted_loan
 *  - Seeded demo data (AlertFactory/AlertSeeder): kyc_expiring, login_attempt,
 *    loan_delinquent
 * NOTE: the backend is inconsistent here — LoanService writes `delinquent_loan`
 * but AlertService's analyst scope filters on `loan_delinquent`. Both spellings
 * must stay in the union until the backend is unified.
 */
export type AlertType =
  | 'suspicious_transaction'
  | 'delinquent_loan'
  | 'defaulted_loan'
  | 'kyc_expiring'
  | 'login_attempt'
  | 'loan_delinquent'

export type AlertSeverity = 'low' | 'medium' | 'high'
export type AlertStatus = 'open' | 'in-progress' | 'resolved'

interface Alertable {
  type: 'Customer' | 'Account' | 'Transaction' | 'Loan'
  id: number
}

export interface Alert {
  id: number
  alert_number: string
  alert_type: AlertType
  severity: AlertSeverity
  description: string
  status: AlertStatus
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
  assigned_to?: User | null
  alertable?: Alertable | null
}

export interface AlertListParams {
  search?: string
  alert_type?: string
  severity?: AlertSeverity | string
  status?: AlertStatus | string
  assigned_to?: number | string
  sort_by?: 'severity' | 'status' | 'created_at' | 'resolved_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface AssignAlertPayload {
  user_id: number
}

