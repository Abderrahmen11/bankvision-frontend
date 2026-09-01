import type { User } from './user'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: User
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
