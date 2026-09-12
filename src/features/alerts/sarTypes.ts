/**
 * SAR (Suspicious Activity Report) Type Definitions for BankVision
 */

export type SarStatus = 'draft' | 'under_review' | 'filed' | 'escalated'

export interface SarFiling {
  id: number
  reference: string
  customer_name: string
  customer_number: string | null
  category: string
  amount: number
  status: SarStatus
  narrative: string
  action_taken: string | null
  date: string | null
  filed_by?: string | null
  alert_id?: number | null
  created_at: string
}

export interface CreateSarFilingPayload {
  customer_name: string
  customer_number?: string
  category: string
  amount: number
  status?: SarStatus
  narrative: string
  action_taken?: string
  alert_id?: number | null
}

export interface SarFilingListParams {
  search?: string
  status?: SarStatus | string
  page?: number
  per_page?: number
}
