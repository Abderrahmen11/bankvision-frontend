import type { UserRole } from '@/shared/types/user'

export type WidgetType =
  | 'stats'
  | 'transaction_chart'
  | 'alerts_panel'
  | 'recent_transactions'
  | 'account_distribution'
  | 'loan_portfolio'
  | 'top_branches'
  | 'system_health'
  | 'compliance'

interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  /**
   * Positions saved while interacting at the md breakpoint (996–1199px, 10
   * columns). Kept separate from the 12-column desktop arrangement so
   * resizing across the lg↔md boundary never clamps or overwrites the saved
   * desktop layout — growing back to lg restores position.x/y/w/h as-is.
   */
  md?: { x: number; y: number; w: number; h: number }
}

export interface WidgetSettings {
  refreshInterval?: number // in seconds, 0 for manual
  days?: number // for transaction chart (7, 14, 30, 90)
  chartType?: 'area' | 'bar' | 'line'
  limit?: number // for recent transactions or alerts
  severity?: 'all' | 'critical' | 'high' | 'medium' | 'low'
  [key: string]: unknown
}

export interface DashboardWidgetConfig {
  id: string
  type: WidgetType
  title?: string
  visible?: boolean
  position: WidgetPosition
  settings?: WidgetSettings
}

export interface DashboardLayoutData {
  columns?: number
  theme?: string
  widgets: DashboardWidgetConfig[]
}

export interface BackendDashboardLayout {
  id: number
  user_id: number
  layout_data: DashboardLayoutData
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface WidgetDefinition {
  type: WidgetType
  label: string
  description: string
  icon: string
  defaultTitle: string
  defaultPosition: { w: number; h: number; minW: number; minH: number }
  allowedRoles: UserRole[]
  defaultSettings: WidgetSettings
}

// API Data Payloads
/**
 * GET /dashboard/stats payload. The backend returns one of two variants:
 *  - Bank-wide (admin/compliance/analyst/auditor): includes total_*, deposits,
 *    volumes, distributions and branch_comparisons.
 *  - Branch-scoped (manager/csr): only new_customers_today,
 *    customers_served_today, pending_transactions, pending_requests,
 *    pending_loans, open_alerts, pending_actions, employee_count.
 * Keys absent from a variant are optional here.
 */
export interface DashboardStatsData {
  // Bank-wide payload keys (omitted in the branch-scoped variant)
  total_customers?: number
  total_accounts?: number
  active_accounts?: number
  total_deposits?: number
  branch_balance?: number
  average_account_balance?: number
  total_transactions?: number
  transaction_volume?: number
  today_transactions?: number
  flagged_transactions?: number
  total_loans?: number
  total_loan_amount?: number
  customer_growth?: number
  loan_default_rate?: number
  // Branch-scoped payload keys (manager/csr variant)
  new_customers_today?: number
  customers_served_today?: number
  pending_transactions?: number
  pending_requests?: number
  // Keys present in both variants
  pending_loans: number
  open_alerts: number
  pending_actions: number
  employee_count: number
  loan_distribution?: Record<string, { loan_type: string; count: number; total_principal: number; total_outstanding: number }>
  customer_risk_distribution?: Record<string, number>
  branch_comparisons?: {
    branch_id: number
    branch_name: string
    city: string
    customer_count: number
    employee_count: number
  }[]
}

export interface TransactionChartPoint {
  date: string
  count: number
  volume: number
}

interface ActivityTransaction {
  id: number
  number: string
  description: string
  status: string
  customer?: string
  date: string
}

interface ActivityAlert {
  id: number
  alert_number: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: string
  created_at: string
}

export interface RecentActivityData {
  transactions: ActivityTransaction[]
  alerts: ActivityAlert[]
}

/**
 * Exact payload of GET /dashboard/reports/risk-analysis
 * (DashboardService::getRiskAnalysis).
 */
export interface RiskAnalysisData {
  customer_risk: {
    total_customers: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    high_risk_percentage: number
  }
  loan_risk: {
    total_loans: number
    delinquent_loans: number
    defaulted_loans: number
    total_exposed_balance: number
    default_rate_percentage: number
  }
  transaction_risk: {
    flagged_count: number
    flagged_volume: number
    wire_count: number
    wire_volume: number
  }
  branch_risk: Array<{
    branch_id: number
    branch_name: string
    total_customers: number
    high_risk_customers: number
    medium_risk_customers: number
    low_risk_customers: number
    high_risk_percentage: number
  }>
}
