import type { UserRole } from '@/shared/types/user'
import type { WidgetType, WidgetDefinition, DashboardWidgetConfig } from '../types'

const WIDGET_CATALOGUE: Record<WidgetType, WidgetDefinition> = {
  stats: {
    type: 'stats',
    label: 'Key Performance Indicators',
    description: 'High-level real-time banking metrics, accounts, deposits, and loan volume.',
    icon: 'TrendingUp',
    defaultTitle: 'Executive KPIs',
    defaultPosition: { w: 12, h: 4, minW: 6, minH: 3 },
    allowedRoles: ['admin', 'manager', 'compliance', 'analyst', 'csr', 'auditor'],
    defaultSettings: { refreshInterval: 60 },
  },

  transaction_chart: {
    type: 'transaction_chart',
    label: 'Transaction Trends Chart',
    description: 'Interactive transaction count & volume trajectory over 7, 14, 30, or 90 days.',
    icon: 'LineChart',
    defaultTitle: 'Transaction Volume & Count Trends',
    defaultPosition: { w: 8, h: 6, minW: 6, minH: 5 },
    allowedRoles: ['admin', 'manager', 'compliance', 'analyst', 'auditor'],
    defaultSettings: { refreshInterval: 120, days: 30, chartType: 'area' },
  },

  alerts_panel: {
    type: 'alerts_panel',
    label: 'Security & Compliance Alerts',
    description: 'Real-time feed of active system, AML, and suspicious behavior alerts.',
    icon: 'AlertTriangle',
    defaultTitle: 'Risk & System Alerts',
    defaultPosition: { w: 4, h: 6, minW: 3, minH: 4 },
    allowedRoles: ['admin', 'manager', 'compliance', 'analyst', 'csr', 'auditor'],
    defaultSettings: { refreshInterval: 30, limit: 6, severity: 'all' },
  },

  recent_transactions: {
    type: 'recent_transactions',
    label: 'Recent Transactions Ledger',
    description: 'Live transaction audit ledger displaying customer, status, amount, and timestamp.',
    icon: 'Receipt',
    defaultTitle: 'Recent Transactions Ledger',
    defaultPosition: { w: 12, h: 6, minW: 6, minH: 5 },
    allowedRoles: ['admin', 'manager', 'compliance', 'analyst', 'csr', 'auditor'],
    defaultSettings: { refreshInterval: 60, limit: 10 },
  },

  account_distribution: {
    type: 'account_distribution',
    label: 'Account Distribution',
    description: 'Breakdown of active customer accounts and deposit distributions.',
    icon: 'PieChart',
    defaultTitle: 'Account Types & Portfolio Breakdown',
    defaultPosition: { w: 6, h: 6, minW: 4, minH: 5 },
    allowedRoles: ['admin', 'manager', 'analyst', 'csr'],
    defaultSettings: { refreshInterval: 300 },
  },

  loan_portfolio: {
    type: 'loan_portfolio',
    label: 'Loan Portfolio & Delinquency',
    description: 'Loan asset status, delinquency monitoring, and principal breakdown.',
    icon: 'BadgePercent',
    defaultTitle: 'Loan Portfolio & Risk Distribution',
    defaultPosition: { w: 6, h: 6, minW: 4, minH: 5 },
    allowedRoles: ['admin', 'manager', 'analyst', 'auditor'],
    defaultSettings: { refreshInterval: 300 },
  },

  top_branches: {
    type: 'top_branches',
    label: 'Branch Performance Leaderboard',
    description: 'Comparative rankings across branches by customer base and staffing.',
    icon: 'Building2',
    defaultTitle: 'Regional Branch Performance',
    defaultPosition: { w: 6, h: 6, minW: 4, minH: 5 },
    allowedRoles: ['admin', 'manager', 'analyst'],
    defaultSettings: { refreshInterval: 300 },
  },

  system_health: {
    type: 'system_health',
    label: 'System Health & Node Status',
    description: 'Live server metrics, API latency, engine uptime, and database connection status.',
    icon: 'Activity',
    defaultTitle: 'Infrastructure & System Health',
    defaultPosition: { w: 6, h: 6, minW: 4, minH: 4 },
    allowedRoles: ['admin', 'auditor'],
    defaultSettings: { refreshInterval: 15 },
  },

  compliance: {
    type: 'compliance',
    label: 'Compliance & AML Monitor',
    description: 'Regulatory compliance score, KYC expiration rate, and risk oversight.',
    icon: 'ShieldCheck',
    defaultTitle: 'KYC & Regulatory Compliance',
    defaultPosition: { w: 6, h: 6, minW: 4, minH: 5 },
    allowedRoles: ['admin', 'compliance', 'auditor', 'csr'],
    defaultSettings: { refreshInterval: 60 },
  },
}

const ROLE_DEFAULT_LAYOUTS: Record<UserRole, DashboardWidgetConfig[]> = {
  admin: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Executive KPIs',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-system-health',
      type: 'system_health',
      title: 'Infrastructure & System Health',
      visible: true,
      position: { x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
      settings: { refreshInterval: 15 },
    },
    {
      id: 'widget-top-branches',
      type: 'top_branches',
      title: 'Regional Branch Performance',
      visible: true,
      position: { x: 6, y: 4, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-transaction-chart',
      type: 'transaction_chart',
      title: 'Transaction Volume & Count Trends',
      visible: true,
      position: { x: 0, y: 10, w: 8, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 120, days: 30, chartType: 'area' },
    },
    {
      id: 'widget-alerts-panel',
      type: 'alerts_panel',
      title: 'Risk & System Alerts',
      visible: true,
      position: { x: 8, y: 10, w: 4, h: 6, minW: 3, minH: 4 },
      settings: { refreshInterval: 30, limit: 6, severity: 'all' },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Recent Transactions Ledger',
      visible: true,
      position: { x: 0, y: 16, w: 12, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 60, limit: 10 },
    },
  ],

  manager: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Branch Key Metrics',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-transaction-chart',
      type: 'transaction_chart',
      title: 'Branch Transaction Velocity',
      visible: true,
      position: { x: 0, y: 4, w: 8, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 120, days: 30, chartType: 'area' },
    },
    {
      id: 'widget-top-branches',
      type: 'top_branches',
      title: 'Branch Comparisons',
      visible: true,
      position: { x: 8, y: 4, w: 4, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-loan-portfolio',
      type: 'loan_portfolio',
      title: 'Branch Loan Health',
      visible: true,
      position: { x: 0, y: 10, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-account-distribution',
      type: 'account_distribution',
      title: 'Customer Account Breakdown',
      visible: true,
      position: { x: 6, y: 10, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Branch Recent Activity',
      visible: true,
      position: { x: 0, y: 16, w: 12, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 60, limit: 10 },
    },
  ],

  compliance: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Compliance & Risk Indicators',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-compliance',
      type: 'compliance',
      title: 'KYC & Regulatory Compliance Oversight',
      visible: true,
      position: { x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-alerts-panel',
      type: 'alerts_panel',
      title: 'High-Priority AML Alerts',
      visible: true,
      position: { x: 6, y: 4, w: 6, h: 6, minW: 3, minH: 4 },
      settings: { refreshInterval: 30, limit: 6, severity: 'critical' },
    },
    {
      id: 'widget-transaction-chart',
      type: 'transaction_chart',
      title: 'Transaction Frequency Trends',
      visible: true,
      position: { x: 0, y: 10, w: 7, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 120, days: 30, chartType: 'bar' },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Flagged & High-Value Transactions',
      visible: true,
      position: { x: 7, y: 10, w: 5, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 60, limit: 8 },
    },
  ],

  analyst: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Financial & Volume Metrics',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-transaction-chart',
      type: 'transaction_chart',
      title: 'Transaction Velocity Analysis',
      visible: true,
      position: { x: 0, y: 4, w: 8, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 120, days: 30, chartType: 'area' },
    },
    {
      id: 'widget-loan-portfolio',
      type: 'loan_portfolio',
      title: 'Loan Portfolio & Risk Spread',
      visible: true,
      position: { x: 8, y: 4, w: 4, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-account-distribution',
      type: 'account_distribution',
      title: 'Deposit Base Distribution',
      visible: true,
      position: { x: 0, y: 10, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-top-branches',
      type: 'top_branches',
      title: 'Branch Comparative Growth',
      visible: true,
      position: { x: 6, y: 10, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Sampled Transactions Stream',
      visible: true,
      position: { x: 0, y: 16, w: 12, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 60, limit: 10 },
    },
  ],

  csr: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Service Counter KPIs',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Customer Transaction Stream',
      visible: true,
      position: { x: 0, y: 4, w: 8, h: 7, minW: 6, minH: 5 },
      settings: { refreshInterval: 30, limit: 10 },
    },
    {
      id: 'widget-alerts-panel',
      type: 'alerts_panel',
      title: 'Customer Service Alerts',
      visible: true,
      position: { x: 8, y: 4, w: 4, h: 7, minW: 3, minH: 4 },
      settings: { refreshInterval: 30, limit: 6 },
    },
    {
      id: 'widget-account-distribution',
      type: 'account_distribution',
      title: 'Account Types Overview',
      visible: true,
      position: { x: 0, y: 11, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 300 },
    },
    {
      id: 'widget-compliance',
      type: 'compliance',
      title: 'Branch Customer KYC Status',
      visible: true,
      position: { x: 6, y: 11, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 60 },
    },
  ],

  auditor: [
    {
      id: 'widget-stats',
      type: 'stats',
      title: 'Audit & Surveillance KPIs',
      visible: true,
      position: { x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-compliance',
      type: 'compliance',
      title: 'Regulatory & AML Compliance Oversight',
      visible: true,
      position: { x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 5 },
      settings: { refreshInterval: 60 },
    },
    {
      id: 'widget-alerts-panel',
      type: 'alerts_panel',
      title: 'Audit Exceptions & Flags',
      visible: true,
      position: { x: 6, y: 4, w: 6, h: 6, minW: 3, minH: 4 },
      settings: { refreshInterval: 30, limit: 8 },
    },
    {
      id: 'widget-recent-transactions',
      type: 'recent_transactions',
      title: 'Auditable Transaction Stream',
      visible: true,
      position: { x: 0, y: 10, w: 8, h: 6, minW: 6, minH: 5 },
      settings: { refreshInterval: 60, limit: 12 },
    },
    {
      id: 'widget-system-health',
      type: 'system_health',
      title: 'System Node & Security Health',
      visible: true,
      position: { x: 8, y: 10, w: 4, h: 6, minW: 4, minH: 4 },
      settings: { refreshInterval: 30 },
    },
  ],
}

export function getAvailableWidgetsForRole(role: UserRole): WidgetDefinition[] {
  return Object.values(WIDGET_CATALOGUE).filter((w) => w.allowedRoles.includes(role))
}

export function getWidgetDefinition(type: WidgetType): WidgetDefinition {
  return WIDGET_CATALOGUE[type]
}

export function getDefaultRoleLayout(role: UserRole): DashboardWidgetConfig[] {
  return ROLE_DEFAULT_LAYOUTS[role] || ROLE_DEFAULT_LAYOUTS.csr
}
