import type { User } from '@/shared/types/user'

export type AlertType =
  | 'kyc_expiring'
  | 'kyc_expired'
  | 'suspicious_transaction'
  | 'large_transaction'
  | 'loan_delinquent'
  | 'defaulted_loan'
  | 'aml_flag'
  | 'fraud_suspected'
  | 'account_dormant'
  | 'other'

export type AlertSeverity = 'low' | 'medium' | 'high'
export type AlertStatus = 'open' | 'in-progress' | 'resolved'

export interface Alertable {
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

export interface ResolveAlertPayload {
  notes?: string
}

export interface AssignAlertPayload {
  user_id: number
}

export interface AlertStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  highSeverity: number
  mediumSeverity: number
  lowSeverity: number
}
