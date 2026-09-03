import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_CONFIGS, type UserRole } from '@/types/user'

/**
 * Custom hook for accessing authentication state and helpers
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const error = useAuthStore((state) => state.error)

  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const clearError = useAuthStore((state) => state.clearError)
  const setUser = useAuthStore((state) => state.setUser)
  const hasRole = useAuthStore((state) => state.hasRole)
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole)

  // Derived role flags
  const role: UserRole | null = user?.role || null
  const roleConfig = role ? ROLE_CONFIGS[role] : null

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isCompliance = role === 'compliance'
  const isAnalyst = role === 'analyst'
  const isCSR = role === 'csr'
  const isAuditor = role === 'auditor'

  // Branch info
  const branch = user?.branch || null
  const branchId = user?.branch_id || branch?.id || null

  return {
    user,
    token,
    role,
    roleConfig,
    branch,
    branchId,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    logout,
    checkAuth,
    clearError,
    setUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isCompliance,
    isAnalyst,
    isCSR,
    isAuditor,
  }
}
