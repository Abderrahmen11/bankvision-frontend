import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE_CONFIGS, type UserRole } from '@/shared/types/user'

/**
 * Custom hook for accessing authentication state and helpers.
 *
 * Uses a single Zustand subscription with shallow equality (via useShallow)
 * instead of 13 separate selectors, reducing subscription overhead.
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    verifyTwoFactor,
    logout,
    checkAuth,
    clearError,
    resendTwoFactor,
    setUser,
    hasRole,
    hasAnyRole,
  } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
      error: state.error,
      login: state.login,
      verifyTwoFactor: state.verifyTwoFactor,
      logout: state.logout,
      checkAuth: state.checkAuth,
      clearError: state.clearError,
      resendTwoFactor: state.resendTwoFactor,
      setUser: state.setUser,
      hasRole: state.hasRole,
      hasAnyRole: state.hasAnyRole,
    }))
  )

  // Derived role flags
  const role: UserRole | null = user?.role || null
  const roleConfig = role ? ROLE_CONFIGS[role] : null

  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isCompliance = role === 'compliance'
  const isAnalyst = role === 'analyst'
  const isCSR = role === 'csr'
  const isAuditor = role === 'auditor'

  // Branch info — UserResource does not serialize branch_id; the branch
  // relation (loaded on /user and login) is the only source.
  const branch = user?.branch || null
  const branchId = branch?.id ?? null

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
    verifyTwoFactor,
    logout,
    checkAuth,
    clearError,
    resendTwoFactor,
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
