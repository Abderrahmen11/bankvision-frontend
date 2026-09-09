import type { Branch, User } from './user'

export type CustomerType = 'premium' | 'regular' | 'business'
export type KycStatus = 'verified' | 'pending' | 'expired'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Customer {
  id: number
  customer_number: string
  full_name: string
  email: string
  phone: string
  address?: string | null
  city?: string | null
  customer_type: CustomerType
  kyc_status: KycStatus
  risk_level: RiskLevel
  registration_date?: string | null
  branch_id?: number | null
  branch?: Branch | null
  relationship_manager_id?: number | null
  relationship_manager?: User | null
  accounts_count?: number
  loans_count?: number
  total_balance?: number
  created_at?: string
  updated_at?: string
}

export interface CustomerAccount {
  id: number
  account_number: string
  customer_id: number
  account_type: 'savings' | 'checking' | 'business' | 'money_market' | string
  currency: string
  balance: number | string
  status: 'active' | 'frozen' | 'closed' | string
  interest_rate?: number | string | null
  opened_date: string
  created_at?: string
}

export interface CustomerLoan {
  id: number
  loan_number: string
  customer_id: number
  loan_type: 'personal' | 'mortgage' | 'business' | 'auto' | string
  principal_amount?: number | string
  outstanding_balance?: number | string
  amount?: number | string
  interest_rate: number | string
  term_months: number
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'delinquent' | 'paid_off' | string
  start_date?: string | null
  next_payment_date?: string | null
  created_at?: string
}

export interface CustomerTransaction {
  id: number
  reference_number?: string
  account_id: number
  account?: CustomerAccount | null
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'wire' | string
  amount: number | string
  currency?: string
  status: 'pending' | 'completed' | 'flagged' | 'failed' | string
  channel?: 'branch' | 'atm' | 'online' | 'mobile' | 'wire' | string
  description?: string | null
  transaction_date: string
  created_at?: string
}

export interface CustomerListParams {
  search?: string
  type?: string
  customer_type?: string
  kyc_status?: string
  risk_level?: string
  branch_id?: number | string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface CreateCustomerPayload {
  full_name: string
  email: string
  phone: string
  address?: string
  city?: string
  customer_type: CustomerType
  branch_id: number
  kyc_status?: KycStatus
  risk_level?: RiskLevel
  registration_date?: string
  relationship_manager_id?: number | null
}

export interface UpdateCustomerPayload {
  full_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  customer_type?: CustomerType
  branch_id?: number
  kyc_status?: KycStatus
  risk_level?: RiskLevel
  relationship_manager_id?: number | null
}
