import type { User } from '@/shared/types/user'

const TOKEN_KEY = 'bankvision_auth_token'
const USER_KEY = 'bankvision_auth_user'

/**
 * Safe LocalStorage abstraction
 */
export const storage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
      console.warn('Failed to persist auth token:', e)
    }
  },

  removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Ignore
    }
  },

  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  },

  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (e) {
      console.warn('Failed to persist user profile:', e)
    }
  },

  removeUser(): void {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      // Ignore
    }
  },

  clearAuth(): void {
    this.removeToken()
    this.removeUser()
  },
}
