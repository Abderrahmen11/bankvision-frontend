// Reports module types (split from types/dashboard.ts in Phase 3 — the
// reports feature owns them; dashboard's api/types keep only dashboard types).
// ─── Reports Module Types ──────────────────────────────────────────────────

export interface ReportFilterParams {
  start_date?: string
  end_date?: string
  branch_id?: number | string
  period?: '7d' | '30d' | '90d' | '1y' | 'ytd' | 'all'
}

export interface TransactionTypeItem {
  name: string
  key: string
  count: number
  total_amount: number
}

export interface DailyTrendPoint {
  date: string
  count: number
  volume: number
}

export interface HighValueTransaction {
  id: number
  transaction_number: string
  type: string
  amount: number
  channel: string
  status: string
  date: string
  account_number?: string
  customer_name?: string
}

export interface LoanTypePerformance {
  loan_type: string
  key: string
  count: number
  total_principal: number
  total_outstanding: number
  avg_rate: number
}

export interface BranchPerformanceMetric {
  branch_id: number
  branch_name: string
  city: string
  status: string
  manager?: string
  customer_count: number
  employee_count: number
  total_deposits: number
  total_loans: number
  tx_volume: number
  tx_count: number
}

export interface BranchRiskItem {
  branch_id: number
  branch_name: string
  total_customers: number
  high_risk_count: number
  medium_risk_count: number
  high_risk_percentage: number
}

export interface LoanRiskHistoryPoint {
  month: string
  delinquency_rate: number
  npl_ratio: number
}

export interface ReportsData {
  /**
   * True when financial statements are derived from ledger totals using
   * configured estimate ratios (fee income, operating costs, provisions, tax)
   * rather than actual accounting records.
   */
  estimated?: boolean
  /** Real 6-month delinquency/NPL history computed from the loan ledger. */
  loan_risk_history?: LoanRiskHistoryPoint[]
  overview: {
    total_revenue: number
    total_expenses: number
    net_profit: number
    profit_margin: number
    transaction_volume: number
    transaction_count: number
    total_deposits: number
    total_loan_outstanding: number
  }
  income_statement: {
    revenue: {
      interest_income: number
      fee_income: number
      total_revenue: number
    }
    expenses: {
      deposit_interest_expense: number
      operating_costs: number
      credit_provisions: number
      total_expenses: number
    }
    net_income_before_tax: number
    tax_provision: number
    net_income: number
    profit_margin: number
  }
  balance_sheet: {
    assets: {
      cash_and_reserves: number
      net_loans: number
      other_assets: number
      total_assets: number
    }
    liabilities: {
      customer_deposits: number
      other_liabilities: number
      total_liabilities: number
    }
    equity: {
      capital: number
      retained_earnings: number
      total_equity: number
    }
  }
  cash_flow: {
    operating: number
    investing: number
    financing: number
    net_change: number
  }
  transaction_analytics: {
    by_type: TransactionTypeItem[]
    by_channel: TransactionTypeItem[]
    daily_trends: DailyTrendPoint[]
    high_value_transactions: HighValueTransaction[]
    total_count: number
    total_volume: number
  }
  loan_analytics: {
    portfolio_summary: {
      total_loans: number
      active_loans: number
      total_principal: number
      total_outstanding: number
      avg_interest_rate: number
      npl_ratio: number
      delinquency_rate: number
    }
    status_breakdown: {
      approved: number
      pending: number
      rejected: number
      delinquent: number
      defaulted: number
    }
    by_type: LoanTypePerformance[]
  }
  risk_compliance: {
    customer_risk: {
      total: number
      high_risk: number
      medium_risk: number
      low_risk: number
      high_pct: number
      medium_pct: number
      low_pct: number
    }
    kyc_status: {
      verified: number
      pending: number
      expired: number
      rejected: number
    }
    aml_alerts: {
      open: number
      resolved: number
      critical: number
    }
    npl_ratio: number
    branch_risk: BranchRiskItem[]
  }
  branch_performance: BranchPerformanceMetric[]
  loan_portfolio?: {
    total_loans?: number
    total_principal?: number
    total_outstanding?: number
    breakdown_by_type?: Record<string, { count: number; principal: number; outstanding: number }>
  }
}
