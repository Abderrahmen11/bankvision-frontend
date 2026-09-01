/**
 * User and Role Definitions for BankVision
 */

export type UserRole =
  | 'admin'
  | 'manager'
  | 'csr'
  | 'compliance'
  | 'auditor'
  | 'analyst'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface Branch {
  id: number
  branch_code: string
  branch_name: string
  address?: string | null
  city?: string | null
  phone?: string | null
  status: 'active' | 'inactive' | 'under_renovation'
  total_employees?: number
  manager_id?: number | null
  manager?: User | null
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  phone?: string | null
  branch_id?: number | null
  branch?: Branch | null
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface RoleConfig {
  label: string
  description: string
  badgeColor: string
  badgeBg: string
  defaultRoute: string
  allowedFeatures: string[]
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    label: 'System Administrator',
    description: 'Full institution-wide administrative & write control',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    defaultRoute: '/dashboard',
    allowedFeatures: ['all'],
  },
  manager: {
    label: 'Branch Manager',
    description: 'Branch oversight, approvals, and employee management',
    badgeColor: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    defaultRoute: '/dashboard',
    allowedFeatures: ['branch_dashboard', 'customers', 'accounts', 'transactions', 'loans', 'alerts', 'employees'],
  },
  compliance: {
    label: 'Compliance Officer',
    description: 'KYC, high-risk investigations, and transaction flagging',
    badgeColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    defaultRoute: '/alerts',
    allowedFeatures: ['compliance_dashboard', 'kyc', 'transactions', 'alerts', 'audit_logs'],
  },
  analyst: {
    label: 'Financial Analyst',
    description: 'Bank-wide portfolio trends, forecasting, and risk analysis',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    defaultRoute: '/dashboard',
    allowedFeatures: ['analytics_dashboard', 'reports', 'risk_analysis', 'trends'],
  },
  csr: {
    label: 'Customer Service Rep',
    description: 'Branch desk operations, customer onboarding, and account services',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    defaultRoute: '/customers',
    allowedFeatures: ['csr_dashboard', 'customers', 'accounts', 'transactions', 'loans'],
  },
  auditor: {
    label: 'Internal Auditor',
    description: 'Unrestricted read-only investigation, audit trails, and logs',
    badgeColor: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    defaultRoute: '/audit-logs',
    allowedFeatures: ['audit_dashboard', 'audit_logs', 'investigations', 'all_read_only'],
  },
}
