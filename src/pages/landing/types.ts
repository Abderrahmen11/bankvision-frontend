export interface RolePersona {
  role: 'admin' | 'manager' | 'compliance' | 'csr' | 'analyst' | 'auditor'
  title: string
  name: string
  email: string
  color: string
  bg: string
  description: string
  features: string[]
}

export const DEMO_PERSONAS: RolePersona[] = [
  {
    role: 'admin',
    title: 'System Administrator',
    name: 'Sarah Connor',
    email: 'admin@bankvision.com',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    description: 'Institution-wide control, user lifecycle, branch management, and system configurations.',
    features: ['All Modules & Overrides', 'User Provisioning', 'Branch Governance', 'Global Audit Trail'],
  },
  {
    role: 'manager',
    title: 'Branch Manager',
    name: 'Marcus Vance',
    email: 'manager@bankvision.com',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    description: 'Branch desk oversight, high-value loan approvals, customer accounts, and staff operations.',
    features: ['Loan Approvals', 'Account Management', 'Branch KPI Metrics', 'Teller Activity Logs'],
  },
  {
    role: 'compliance',
    title: 'Compliance Officer',
    name: 'Elena Rostova',
    email: 'compliance@bankvision.com',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    description: 'Automated AML screening, KYC review queues, transaction flagging, and regulatory reporting.',
    features: ['AML & KYC Alerts', 'Flagged Transaction Review', 'SAR Generation', 'Risk Classifications'],
  },
  {
    role: 'csr',
    title: 'Customer Service Rep',
    name: 'David Chen',
    email: 'csr@bankvision.com',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    description: 'Front-desk operations, new customer onboarding, account creation, and instant deposits/transfers.',
    features: ['Customer Onboarding', 'Deposit/Withdrawal Desk', 'Account Opening', 'Card Services'],
  },
  {
    role: 'analyst',
    title: 'Financial Analyst',
    name: 'Amara Okafor',
    email: 'analyst@bankvision.com',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    description: 'Bank-wide portfolio trends, liquidity forecasting, stress testing, and risk exposure analytics.',
    features: ['Liquidity Forecasting', 'Risk Modeling', 'Portfolio Trends', 'Executive Reports'],
  },
  {
    role: 'auditor',
    title: 'Internal Auditor',
    name: 'Thomas Wright',
    email: 'auditor@bankvision.com',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    description: 'Read-only immutable audit trail access, compliance tracking, and forensic transaction ledger logs.',
    features: ['Immutable Event Logs', 'Ledger Integrity Checks', 'Compliance Verification', 'Forensic Export'],
  },
]
