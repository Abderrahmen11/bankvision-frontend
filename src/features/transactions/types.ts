import type { BankAccount } from '../accounts/types'

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'wire'
export type TransactionStatus = 'pending' | 'completed' | 'flagged' | 'failed'
export type TransactionChannel = 'branch' | 'atm' | 'online' | 'mobile' | 'wire'

interface TransactionApprover {
  id: number
  name: string
  email?: string
  role?: string
}

export interface Transaction {
  id: number
  transaction_number: string
  transaction_type: TransactionType
  /** Decimal:2 string as serialized by TransactionResource — parse via toAmountNumber() for math */
  amount: string
  currency: string
  transaction_date: string
  description?: string | null
  status: TransactionStatus
  channel?: TransactionChannel | string | null
  counterparty?: string | null
  approved_at?: string | null
  account_id?: number
  account?: BankAccount | null
  approver?: TransactionApprover | null
  created_at?: string
  updated_at?: string
}

export interface TransactionListParams {
  search?: string
  account_id?: number | string
  transaction_type?: string
  type?: string
  status?: string
  channel?: string
  date_from?: string
  date_to?: string
  sort_by?: 'transaction_date' | 'approved_at' | 'amount' | 'created_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface RecordTransactionPayload {
  account_id: number
  transaction_type: TransactionType
  amount: number
  currency?: string
  description?: string
  channel?: TransactionChannel
  status?: 'pending' | 'completed'
  counterparty?: string
}
