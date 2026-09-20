import type { UserRole } from '@/shared/types/user'

/**
 * Centralized role-set constants.
 *
 * Import these everywhere you need an allowedRoles array instead of
 * inlining literals. A single file change here propagates to all routes,
 * sidebar items, and permission helpers when roles evolve.
 */

/** Every defined role - used for routes accessible to all authenticated staff. */
export const ALL_ROLES: UserRole[] = ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']

/** Core banking operations: admins, managers, front-office staff, and read-only roles. */
export const CORE_BANKING_ROLES: UserRole[] = ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']

/** Branch and operations oversight - no CSR (branch-desk only). */
export const BRANCH_ROLES: UserRole[] = ['admin', 'manager', 'analyst', 'auditor', 'compliance']

/** User / access governance: admin and manager only. */
export const USER_MGMT_ROLES: UserRole[] = ['admin', 'manager']

/** Risk, fraud, and KYC alerts (visible to all except pure-reader roles). */
export const ALERT_ROLES: UserRole[] = ['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor']

/** AML dashboard: no CSR (requires analytical/compliance context). */
export const AML_ROLES: UserRole[] = ['admin', 'manager', 'compliance', 'analyst', 'auditor']

/** Audit logs: compliance and auditors + management. */
export const AUDIT_ROLES: UserRole[] = ['admin', 'manager', 'compliance', 'auditor']

/** Analytics / risk analysis / reports. */
export const ANALYTICS_ROLES: UserRole[] = ['admin', 'analyst', 'compliance', 'auditor', 'manager']

/** Admin-only routes (system config, etc.). */
export const ADMIN_ONLY_ROLES: UserRole[] = ['admin']
