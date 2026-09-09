import { useAuth } from './useAuth'
import type { UserRole } from '@/types/user'

/**
 * Hook for granular permission checking across BankVision features
 */
export function usePermission() {
  const { role, hasRole, hasAnyRole } = useAuth()

  const can = (allowedRoles: UserRole[]): boolean => {
    return hasAnyRole(allowedRoles)
  }

  return {
    role,
    can,
    hasRole,
    hasAnyRole,

    // Customers
    canCreateCustomer: hasAnyRole(['admin', 'manager', 'csr']),
    canUpdateCustomer: hasAnyRole(['admin', 'manager', 'csr']),
    canDeleteCustomer: hasRole('admin'),

    // Accounts
    canOpenAccount: hasAnyRole(['admin', 'manager', 'csr']),
    canUpdateAccount: hasAnyRole(['admin', 'manager', 'csr']),
    canCloseAccount: hasAnyRole(['admin', 'manager', 'csr']),

    // Transactions
    canCreateTransaction: hasAnyRole(['admin', 'manager', 'csr']),
    canApproveTransaction: hasAnyRole(['admin', 'manager', 'compliance']),
    canFlagTransaction: hasAnyRole(['admin', 'manager', 'compliance']),

    // Loans
    canSubmitLoan: hasAnyRole(['admin', 'manager', 'csr']),
    canUpdateLoan: hasAnyRole(['admin', 'manager', 'csr']),
    canApproveLoan: hasAnyRole(['admin', 'manager']),

    // Alerts
    canAssignAlert: hasAnyRole(['admin', 'manager', 'compliance']),
    canResolveAlert: hasAnyRole(['admin', 'manager', 'compliance']),

    // Administration & Users
    canManageUsers: hasRole('admin'),
    canManageBranches: hasRole('admin'),
    canManageSettings: hasRole('admin'),

    // Reports & Analytics
    canViewReports: hasAnyRole(['admin', 'manager', 'analyst']),
    canViewRiskAnalysis: hasAnyRole(['admin', 'analyst']),
    canExportReports: hasAnyRole(['admin', 'manager', 'analyst', 'auditor']),

    // Auditing & Investigations
    canAccessAuditLogs: hasAnyRole(['admin', 'auditor', 'compliance']),
    canAccessAuditDashboard: hasAnyRole(['admin', 'auditor']),
    isReadOnly: hasRole('auditor'),
  }
}

export type PermissionKey = keyof Omit<
  ReturnType<typeof usePermission>,
  'role' | 'can' | 'hasRole' | 'hasAnyRole'
>
