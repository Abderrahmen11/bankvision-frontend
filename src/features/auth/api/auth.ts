// Authentication API + payload types (types co-located with the API so
// store/ can import everything from features/*/api/* per the FSD boundaries).
import { apiClient } from '@/shared/api/client'
import type { User } from '@/shared/types/user'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  token?: string
  user?: User
  /** Present when 2FA is enabled: an email code challenge is pending */
  requires_2fa?: boolean
  email?: string
  /** Dev only: points to the log file when the mailer is log-driven */
  dev_hint?: string
}

/** Error thrown by the auth store when a 2FA email code is required */
export class TwoFactorRequiredError extends Error {
  readonly requires2fa = true as const
  readonly email: string
  /** Dev only: where to find the code (log file) when the mailer is log-driven */
  readonly devHint?: string
  constructor(message: string, email: string, devHint?: string) {
    super(message)
    this.name = 'TwoFactorRequiredError'
    this.email = email
    this.devHint = devHint
  }
}

export interface UserProfileResponse {
  success: boolean
  user: User
}

export interface LogoutResponse {
  success: boolean
  message: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Submit credentials to authenticate user & get Sanctum token.
   * Throws an Error with `requires2fa = true` when an email code challenge
   * is pending instead of returning a token.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', {
      email: credentials.email,
      password: credentials.password,
    })
    return response.data
  },

  /**
   * Complete a two-factor login by verifying the emailed code.
   */
  async verifyTwoFactorLogin(email: string, code: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login/2fa', { email, code })
    return response.data
  },

  /**
   * Revoke current Sanctum token on backend
   */
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/logout')
    return response.data
  },

  /**
   * Re-issue the 2FA code for a pending login challenge (dev convenience).
   */
  async resendTwoFactorLogin(email: string): Promise<{ requires_2fa: boolean; message: string; dev_hint?: string }> {
    const response = await apiClient.post<{ requires_2fa: boolean; message: string; dev_hint?: string }>(
      '/login/2fa/resend',
      { email },
    )
    return response.data
  },

  /**
   * Fetch authenticated staff profile with branch details
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<UserProfileResponse>('/user')
    return response.data.user
  },
}
