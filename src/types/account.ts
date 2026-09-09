import type { Customer } from './customer'

export type AccountType = 'savings' | 'checking' | 'business'
export type AccountStatus = 'active' | 'frozen' | 'closed'

export interface BankAccount {
  id: number
  account_number: string
  customer_id: number
  account_type: AccountType
  currency: string
  balance: number
  status: AccountStatus
  opened_date: string
  interest_rate: number
  customer?: Customer
  created_at?: string
  updated_at?: string
}


export interface AccountListParams {
  search?: string
  type?: string
  account_type?: string
  status?: string
  currency?: string
  customer_id?: number | string
  branch_id?: number | string
  balance_min?: number
  balance_max?: number
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface OpenAccountPayload {
  customer_id: number
  account_type: AccountType
  currency: string
  balance?: number
  opening_balance?: number
  interest_rate?: number
  opened_date?: string
}

export interface UpdateAccountPayload {
  status?: AccountStatus
  interest_rate?: number
}
