import type { Customer } from '../customers/types'

export type LoanType = 'mortgage' | 'personal' | 'auto' | 'business'
export type LoanStatus = 'pending' | 'active' | 'delinquent' | 'defaulted' | 'completed'

export interface Loan {
  id: number
  loan_number: string
  loan_type: LoanType
  principal_amount: number
  outstanding_balance: number
  interest_rate: number
  term_months: number
  start_date: string
  end_date?: string | null
  status: LoanStatus
  next_payment_date?: string | null
  customer_id?: number
  customer?: Customer | null
  created_at?: string
  updated_at?: string
}

export interface LoanListParams {
  search?: string
  customer_id?: number | string
  loan_type?: string
  type?: string
  status?: string
  term_months?: number
  principal_amount_min?: number
  principal_amount_max?: number
  outstanding_balance_min?: number
  outstanding_balance_max?: number
  interest_rate_min?: number
  interest_rate_max?: number
  sort_by?:
    | 'principal_amount'
    | 'outstanding_balance'
    | 'interest_rate'
    | 'start_date'
    | 'end_date'
    | 'next_payment_date'
    | 'created_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ApplyLoanPayload {
  customer_id: number
  loan_type: LoanType
  principal_amount: number
  interest_rate: number
  term_months: number
  start_date: string
}

export interface UpdateLoanPayload {
  outstanding_balance?: number
  next_payment_date?: string
  status?: LoanStatus
}
