import { create } from 'zustand'
import { authApi } from '@/api/auth'
import { storage } from '@/utils/storage'
import type { AuthState, LoginCredentials } from '@/types/auth'
import type { User, UserRole } from '@/types/user'

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User) => void
  clearError: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
}

export type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => {
  // Listen for global unauthorized events emitted by apiClient
  if (typeof window !== 'undefined') {
    window.addEventListener('bankvision:unauthorized', () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Your session has expired. Please sign in again.',
      })
    })
  }

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
        const { token, user } = response

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
