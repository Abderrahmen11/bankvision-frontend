import { useAuth } from './useAuth'

export interface BranchFilterResult {
  branchId: number | null
  branchName: string
  isBranchScoped: boolean
  canViewAllBranches: boolean
  branchFilterParams: { branch_id?: number }
  filterByBranch: <T extends { branch_id?: number | null }>(items: T[]) => T[]
}

/**
 * Custom hook to enforce role-based branch scoping.
 * - Branch Managers and CSRs are strictly scoped to their assigned branch.
 * - Administrators, Auditors, Compliance Officers, and Financial Analysts have enterprise-wide branch visibility.
 */
export function useBranchFilter(): BranchFilterResult {
  const { role, branchId, branch } = useAuth()

  // Roles that are strictly confined to their local branch
  const isBranchScoped = (role === 'manager' || role === 'csr') && branchId !== null

  // Enterprise roles that can view across all branches
  const canViewAllBranches = !isBranchScoped

  const branchName = branch?.branch_name || (branchId ? `Branch #${branchId}` : 'All Branches (Enterprise)')

  const branchFilterParams = isBranchScoped && branchId ? { branch_id: branchId } : {}

  /**
   * Client-side array filtering helper for items that carry a branch_id
   */
  const filterByBranch = <T extends { branch_id?: number | null }>(items: T[]): T[] => {
    if (!isBranchScoped || !branchId) {
      return items
    }
    return items.filter((item) => item.branch_id === branchId)
  }

  return {
    branchId: branchId || null,
    branchName,
    isBranchScoped,
    canViewAllBranches,
    branchFilterParams,
    filterByBranch,
  }
}
