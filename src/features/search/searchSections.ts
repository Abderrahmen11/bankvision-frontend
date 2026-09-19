import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CreditCard,
  FileSearch,
  HandCoins,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserCircle,
  UserCog,
  Users,
  Bell,
  Settings,
  Flame,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/shared/types/user'

type SearchItemKind = 'section' | 'tab' | 'docs' | 'landing'

export interface SearchSectionItem {
  id: string
  kind: SearchItemKind
  /** Category the result is grouped under (e.g. "Core Banking", "Documentation"). */
  group: string
  title: string
  subtitle: string
  route: string
  icon: LucideIcon
  keywords?: string
  /** Roles allowed to see this entry — omit for everyone. */
  roles?: UserRole[]
  /** Context restriction: 'landing' → landing page only, 'app' → inside the app. */
  context?: 'landing' | 'app'
}

const ALL_ROLES: UserRole[] = ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']

/**
 * Static, hardcoded directory of every app section, settings tab and docs /
 * landing section that global search can find — ~40 items total, so matching
 * is a plain Array.filter over title + subtitle + keywords. No API, no index,
 * no loading state.
 */
const SEARCH_SECTIONS: SearchSectionItem[] = [
  /* ── Core Banking ── */
  { id: 'dashboard', kind: 'section', group: 'Core Banking', title: 'Dashboard', subtitle: 'Operational overview & widgets', route: '/dashboard', icon: LayoutDashboard, keywords: 'home executive workspace kpi', roles: ALL_ROLES },
  { id: 'customers', kind: 'section', group: 'Core Banking', title: 'Customers', subtitle: 'Customer profiles & KYC', route: '/customers', icon: Users, keywords: 'clients people profiles kyc', roles: ALL_ROLES },
  { id: 'accounts', kind: 'section', group: 'Core Banking', title: 'Accounts', subtitle: 'Deposit & checking accounts', route: '/accounts', icon: CreditCard, keywords: 'deposits checking savings balance', roles: ALL_ROLES },
  { id: 'transactions', kind: 'section', group: 'Core Banking', title: 'Transactions', subtitle: 'Transaction ledger & clearing', route: '/transactions', icon: ArrowLeftRight, keywords: 'ledger transfers wires payments', roles: ALL_ROLES },
  { id: 'loans', kind: 'section', group: 'Core Banking', title: 'Loans', subtitle: 'Loan origination & servicing', route: '/loans', icon: HandCoins, keywords: 'credit lending amortization', roles: ALL_ROLES },

  /* ── Operations & Management ── */
  { id: 'branches', kind: 'section', group: 'Operations', title: 'Branches', subtitle: 'Branch network oversight', route: '/branches', icon: Building2, keywords: 'offices locations network', roles: ['admin', 'manager', 'compliance', 'analyst', 'auditor'] },
  { id: 'users', kind: 'section', group: 'Operations', title: 'User Management', subtitle: 'Staff & access governance', route: '/users', icon: UserCog, keywords: 'staff accounts access administration', roles: ['admin', 'manager'] },

  /* ── Risk & Audit ── */
  { id: 'alerts', kind: 'section', group: 'Risk & Audit', title: 'Risk & Fraud Alerts', subtitle: 'AML monitoring & suspicious activity', route: '/alerts', icon: ShieldAlert, keywords: 'aml suspicious fraud monitoring', roles: ALL_ROLES },
  { id: 'kyc-queue', kind: 'section', group: 'Risk & Audit', title: 'KYC Queue', subtitle: 'Pending verification pipeline', route: '/alerts/kyc', icon: UserCheck, keywords: 'kyc verification onboarding queue', roles: ALL_ROLES },
  { id: 'aml-dashboard', kind: 'section', group: 'Risk & Audit', title: 'AML Dashboard', subtitle: 'Anti-money-laundering metrics', route: '/alerts/aml', icon: Flame, keywords: 'anti money laundering risk metrics', roles: ['admin', 'manager', 'compliance', 'analyst', 'auditor'] },
  { id: 'audit-logs', kind: 'section', group: 'Risk & Audit', title: 'Audit Logs', subtitle: 'System & data audit trail', route: '/audit-logs', icon: FileSearch, keywords: 'trail compliance history events', roles: ['admin', 'manager', 'compliance', 'auditor'] },
  { id: 'risk-analysis', kind: 'section', group: 'Risk & Audit', title: 'Risk Modeling', subtitle: 'Risk exposure & analytics', route: '/risk-analysis', icon: TrendingUp, keywords: 'exposure modeling analytics risk scores', roles: ['admin', 'manager', 'analyst', 'auditor', 'compliance'] },

  /* ── Account & Settings ── */
  { id: 'profile', kind: 'section', group: 'Account & Settings', title: 'Profile Settings', subtitle: 'Your profile & credentials', route: '/profile', icon: UserCircle, keywords: 'account personal avatar password', roles: ALL_ROLES },
  { id: 'settings', kind: 'section', group: 'Account & Settings', title: 'Settings', subtitle: 'Preferences & platform configuration', route: '/settings', icon: Settings, keywords: 'configuration preferences options', roles: ALL_ROLES },
  { id: 'settings-security', kind: 'tab', group: 'Account & Settings', title: 'Security Settings', subtitle: 'Sessions, password & login history', route: '/settings?tab=security', icon: Shield, keywords: 'security password sessions login history two factor', roles: ALL_ROLES },
  { id: 'settings-notifications', kind: 'tab', group: 'Account & Settings', title: 'Notification Settings', subtitle: 'Alert & email preferences', route: '/settings?tab=notifications', icon: Bell, keywords: 'notifications email alerts preferences', roles: ALL_ROLES },
  { id: 'settings-preferences', kind: 'tab', group: 'Account & Settings', title: 'Preferences', subtitle: 'Theme & display options', route: '/settings?tab=preferences', icon: Settings, keywords: 'theme display dark light preferences', roles: ALL_ROLES },
  { id: 'settings-system', kind: 'tab', group: 'Account & Settings', title: 'System Configuration', subtitle: 'Platform-wide configuration', route: '/settings/system', icon: Settings, keywords: 'system platform configuration admin', roles: ['admin'] },

  /* ── Documentation (public page sections) ── */
  { id: 'docs', kind: 'docs', group: 'Documentation', title: 'Documentation', subtitle: 'Platform guide & API reference', route: '/docs', icon: BookOpen, keywords: 'docs guide api reference help' },
  { id: 'docs-overview', kind: 'docs', group: 'Documentation', title: 'Overview & Stack', subtitle: 'Documentation · architecture', route: '/docs#overview', icon: BookOpen, keywords: 'introduction architecture laravel react' },
  { id: 'docs-ledger', kind: 'docs', group: 'Documentation', title: 'Core Banking Ledger', subtitle: 'Documentation · double-entry design', route: '/docs#ledger', icon: BookOpen, keywords: 'ledger double entry journal posting' },
  { id: 'docs-accounts', kind: 'docs', group: 'Documentation', title: 'Accounts & Journals', subtitle: 'Documentation · account APIs', route: '/docs#accounts', icon: CreditCard, keywords: 'accounts api endpoints opening' },
  { id: 'docs-transactions', kind: 'docs', group: 'Documentation', title: 'Transaction Clearing', subtitle: 'Documentation · clearing APIs', route: '/docs#transactions', icon: ArrowLeftRight, keywords: 'transactions clearing api wires' },
  { id: 'docs-loans', kind: 'docs', group: 'Documentation', title: 'Loan Origination', subtitle: 'Documentation · loan APIs', route: '/docs#loans', icon: HandCoins, keywords: 'loans api origination servicing' },
  { id: 'docs-compliance', kind: 'docs', group: 'Documentation', title: 'AML & KYC Engine', subtitle: 'Documentation · compliance engine', route: '/docs#compliance', icon: ShieldAlert, keywords: 'aml kyc compliance alerts engine' },
  { id: 'docs-rbac', kind: 'docs', group: 'Documentation', title: 'Role Governance (RBAC)', subtitle: 'Documentation · roles & permissions', route: '/docs#rbac', icon: Shield, keywords: 'rbac roles permissions governance' },
  { id: 'docs-api', kind: 'docs', group: 'Documentation', title: 'API Specifications', subtitle: 'Documentation · REST endpoints', route: '/docs#api', icon: BookOpen, keywords: 'api rest endpoints specifications authentication' },
  { id: 'docs-faq', kind: 'docs', group: 'Documentation', title: 'Frequently Asked Questions', subtitle: 'Documentation · FAQ', route: '/docs#faq', icon: HelpCircle, keywords: 'faq questions help answers' },

  /* ── Landing page (public sections) ── */
  { id: 'landing-home', kind: 'landing', group: 'Public Pages', title: 'BankVision Home', subtitle: 'Product landing page', route: '/', icon: Landmark, keywords: 'home landing product overview', context: 'landing' },
  { id: 'landing-features', kind: 'landing', group: 'Public Pages', title: 'Features', subtitle: 'Core banking capabilities', route: '/#features', icon: Sparkles, keywords: 'features capabilities modules product', context: 'landing' },
  { id: 'landing-roles', kind: 'landing', group: 'Public Pages', title: 'Demo Roles', subtitle: 'Explore all six personas', route: '/#demo-roles', icon: Users, keywords: 'personas demo roles admin manager csr', context: 'landing' },
  { id: 'landing-getting-started', kind: 'landing', group: 'Public Pages', title: 'Getting Started', subtitle: 'Launch the live demo', route: '/#getting-started', icon: Landmark, keywords: 'getting started launch demo login cta', context: 'landing' },
  { id: 'landing-security', kind: 'landing', group: 'Public Pages', title: 'Security & Trust', subtitle: 'Encryption & reliability', route: '/#security', icon: Shield, keywords: 'security trust encryption tls reliability', context: 'landing' },
]

/** Categories for the empty-query panel — context- and role-aware. */
export interface SearchCategory {
  key: string
  label: string
  description: string
  icon: LucideIcon
  route: string
}

const CATEGORY_DEFS: (SearchCategory & { roles?: UserRole[] })[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Operational overview', icon: LayoutDashboard, route: '/dashboard' },
  { key: 'customers', label: 'Customers', description: 'Customer profiles & KYC', icon: Users, route: '/customers' },
  { key: 'accounts', label: 'Accounts', description: 'Deposit & checking accounts', icon: CreditCard, route: '/accounts' },
  { key: 'transactions', label: 'Transactions', description: 'Transaction ledger', icon: ArrowLeftRight, route: '/transactions' },
  { key: 'loans', label: 'Loans', description: 'Loan origination & servicing', icon: HandCoins, route: '/loans' },
  { key: 'alerts', label: 'Alerts', description: 'Risk & fraud monitoring', icon: ShieldAlert, route: '/alerts' },
  { key: 'users', label: 'Users', description: 'Staff & access governance', icon: UserCog, route: '/users', roles: ['admin', 'manager'] },
  { key: 'branches', label: 'Branches', description: 'Branch network oversight', icon: Building2, route: '/branches', roles: ['admin', 'manager', 'compliance', 'analyst', 'auditor'] },
  { key: 'audit', label: 'Audit Logs', description: 'System & data audit trail', icon: FileSearch, route: '/audit-logs', roles: ['admin', 'manager', 'compliance', 'auditor'] },
  { key: 'docs', label: 'Documentation', description: 'Platform guide & API reference', icon: BookOpen, route: '/docs' },
]

const LANDING_CATEGORIES: SearchCategory[] = [
  { key: 'landing-docs', label: 'Documentation', description: 'Platform guide & API reference', icon: BookOpen, route: '/docs' },
  { key: 'landing-features', label: 'Features', description: 'Core banking capabilities', icon: Sparkles, route: '/#features' },
  { key: 'landing-getting-started', label: 'Getting Started', description: 'Launch the live demo', icon: Landmark, route: '/#getting-started' },
  { key: 'landing-roles', label: 'Demo Roles', description: 'Explore all six personas', icon: Users, route: '/#demo-roles' },
]

const DOCS_HOME_CATEGORY: SearchCategory = {
  key: 'docs-home',
  label: 'Documentation Home',
  description: 'Back to the platform guide',
  icon: BookOpen,
  route: '/docs',
}

const DOCS_SECTION_CATEGORIES: SearchCategory[] = [
  { key: 'docs-overview', label: '1. Overview & Stack', description: 'Documentation section', icon: BookOpen, route: '/docs#overview' },
  { key: 'docs-ledger', label: '2. Core Banking Ledger', description: 'Documentation section', icon: BookOpen, route: '/docs#ledger' },
  { key: 'docs-accounts', label: '3. Accounts & Journals', description: 'Documentation section', icon: BookOpen, route: '/docs#accounts' },
  { key: 'docs-transactions', label: '4. Transaction Clearing', description: 'Documentation section', icon: BookOpen, route: '/docs#transactions' },
  { key: 'docs-loans', label: '5. Loan Origination', description: 'Documentation section', icon: BookOpen, route: '/docs#loans' },
  { key: 'docs-compliance', label: '6. AML & KYC Engine', description: 'Documentation section', icon: BookOpen, route: '/docs#compliance' },
  { key: 'docs-rbac', label: '7. Role Governance (RBAC)', description: 'Documentation section', icon: BookOpen, route: '/docs#rbac' },
  { key: 'docs-api', label: '8. API Specifications', description: 'Documentation section', icon: BookOpen, route: '/docs#api' },
  { key: 'docs-faq', label: '9. Frequently Asked Questions', description: 'Documentation section', icon: HelpCircle, route: '/docs#faq' },
]

/** Static categories for the current page context + role (no data needed). */
export function getCategories(pathname: string, role: UserRole | undefined): SearchCategory[] {
  if (pathname === '/') return LANDING_CATEGORIES
  if (pathname.startsWith('/docs')) return [DOCS_HOME_CATEGORY, ...DOCS_SECTION_CATEGORIES]
  const accessible = CATEGORY_DEFS.filter((c) => !c.roles || (role && c.roles.includes(role)))
  // Prioritize the module the user is currently browsing (e.g. /customers)
  const match = accessible.find((c) => pathname.startsWith(c.route) && c.route !== '/dashboard')
  if (!match) return accessible
  return [match, ...accessible.filter((c) => c !== match)]
}

/** Items visible to a role on the current page context. */
export function itemsForContext(pathname: string, role: UserRole | undefined): SearchSectionItem[] {
  const onLanding = pathname === '/'
  const inDocs = pathname.startsWith('/docs')
  return SEARCH_SECTIONS.filter((item) => {
    if (item.roles && (!role || !item.roles.includes(role))) return false
    if (item.context === 'landing' && !onLanding) return false
    // Landing/docs entries are always findable from public pages and the app;
    // app-only sections are meaningless on public pages.
    if (item.kind === 'section' && onLanding) return false
    if (item.kind === 'tab' && onLanding) return false
    if (inDocs && (item.kind === 'section' || item.kind === 'tab')) {
      // On the docs page, prioritize docs entries — app sections still match
      // only if the query explicitly hits them (handled by ranking).
    }
    return true
  })
}

/** Plain case-insensitive substring match over title, subtitle and keywords. */
export function matchesQuery(item: SearchSectionItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  // Every whitespace-separated token must match somewhere (AND semantics)
  const haystack = `${item.title} ${item.subtitle} ${item.keywords ?? ''}`.toLowerCase()
  return q.split(/\s+/).every((token) => haystack.includes(token))
}
