import { apiClient } from './client'
import type { LoginCredentials, LoginResponse, UserProfileResponse, LogoutResponse } from '@/types/auth'
import type { User } from '@/types/user'

/**
 * Authentication API Service
 */
export const authApi = {
  /**
   * Submit credentials to authenticate user & get Sanctum token
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', {
      email: credentials.email,
      password: credentials.password,
    })
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
   * Fetch authenticated staff profile with branch details
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<UserProfileResponse>('/user')
    return response.data.user
  },
}
