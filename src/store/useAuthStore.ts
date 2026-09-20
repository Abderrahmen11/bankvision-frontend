import { storage } from '@/shared/utils'
import { create } from 'zustand'
import { authApi } from '@/features/auth/api/auth'
import { TwoFactorRequiredError, type AuthState, type LoginCredentials } from '@/features/auth/api/auth'
import type { User, UserRole } from '@/shared/types/user'

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<User>
  verifyTwoFactor: (email: string, code: string) => Promise<User>
  resendTwoFactor: (email: string) => Promise<string | null>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User) => void
  clearError: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => {
  const initialToken = storage.getToken()
  const initialUser = storage.getUser()

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: Boolean(initialToken),
    isLoading: false,
    isInitialized: false,
    error: null,

    /**
     * Authenticate with email & password
     */
    login: async (credentials: LoginCredentials): Promise<User> => {
      set({ isLoading: true, error: null })
      try {
        const response = await authApi.login(credentials)

        // 2FA enabled on this account: an email code challenge is pending
        if (response.requires_2fa || !response.token || !response.user) {
          set({ isLoading: false, error: null })
          throw new TwoFactorRequiredError(
            response.message || 'A verification code has been sent to your email.',
            credentials.email,
            response.dev_hint
          )
        }

        const { token, user } = response as { token: string; user: User }

        // Persist token and user
        storage.setToken(token)
        storage.setUser(user)

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        })

        return user
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed.'
        set({
          isLoading: false,
          error: message,
          isAuthenticated: false,
          user: null,
          token: null,
        })
        storage.clearAuth()
        throw err
      }
    },

    /**
     * Complete a two-factor login: verify the emailed code and finish sign-in.
     */
    verifyTwoFactor: async (email: string, code: string): Promise<User> => {
      set({ isLoading: true, error: null })
      try {
        const response = await authApi.verifyTwoFactorLogin(email, code)
        if (!response.token || !response.user) {
          throw new Error(response.message || 'Invalid or expired verification code.')
        }

        const { token, user } = response
        storage.setToken(token)
        storage.setUser(user)

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        })

        return user
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Verification failed.'
        set({ isLoading: false, error: message })
        throw err
      }
    },

    /**
     * Re-issue the 2FA code for a pending login challenge. Returns the dev
     * hint when the backend runs with the log mailer (dev only).
     */
    resendTwoFactor: async (email: string): Promise<string | null> => {
      const response = await authApi.resendTwoFactorLogin(email)
      return response.dev_hint ?? null
    },

    /**
     * Terminate session on client and revoke token on backend
     */
    logout: async (): Promise<void> => {
      set({ isLoading: true })
      try {
        if (get().token) {
          await authApi.logout().catch(() => {
            // Silently ignore backend logout failures on network disconnect
          })
        }
      } finally {
        storage.clearAuth()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }
    },

    /**
     * Check and validate current session on application bootstrap
     */
    checkAuth: async (): Promise<void> => {
      const token = storage.getToken()

      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        })
        return
      }

      set({ isLoading: true })
      try {
        const user = await authApi.getCurrentUser()
        storage.setUser(user)
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        })
      } catch {
        // Token is invalid/expired
        storage.clearAuth()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        })
      }
    },

    /**
     * Manually update the current user in state and storage
     */
    setUser: (user: User) => {
      storage.setUser(user)
      set({ user })
    },

    /**
     * Clear active error message
     */
    clearError: () => set({ error: null }),

    /**
     * Helper to verify if current user has the specified role(s)
     */
    hasRole: (role: UserRole | UserRole[]): boolean => {
      const currentUser = get().user
      if (!currentUser) return false

      if (Array.isArray(role)) {
        return role.includes(currentUser.role)
      }
      return currentUser.role === role
    },

    /**
     * Helper to verify if current user has any of the listed roles
     */
    hasAnyRole: (roles: UserRole[]): boolean => {
      const currentUser = get().user
      if (!currentUser) return false
      return roles.includes(currentUser.role)
    },
  }
})
