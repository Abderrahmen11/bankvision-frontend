import { storage } from '@/shared/utils'
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import type { ApiErrorResponse, ApiEnhancedError } from '@/shared/types/api'

/**
 * BankVision Centralized Axios API Client
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Attach Sanctum Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle Global 401 / 403 / Error formatting
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const data = error.response?.data

    // If 401 Unauthenticated, broadcast auth expiration event and clear local token
    if (status === 401) {
      storage.clearAuth()
      window.dispatchEvent(new CustomEvent('bankvision:unauthorized'))
    }

    // Extract formatted message
    let message = data?.message || error.message || 'An unexpected error occurred.'

    // If Laravel returned validation errors, append the first validation message
    if (data?.errors && typeof data.errors === 'object') {
      const firstErrorKey = Object.keys(data.errors)[0]
      if (firstErrorKey && data.errors[firstErrorKey]?.[0]) {
        message = data.errors[firstErrorKey][0]
      }
    }

    // Normalize 403 messages so permission problems are always recognizable
    // (Laravel usually prefixes "Access forbidden." but not every path does)
    if (status === 403) {
      if (!/^access (forbidden|denied)/i.test(message)) {
        message = `Access denied: ${message}`
      }
      window.dispatchEvent(
        new CustomEvent('bankvision:forbidden', {
          detail: { message, status: 403, url: error.config?.url },
        })
      )
    }

    const enhancedError = new Error(message) as ApiEnhancedError

    enhancedError.status = status
    enhancedError.forbidden = status === 403
    enhancedError.errors = data?.errors
    enhancedError.raw = data

    return Promise.reject(enhancedError)
  }
)

/** True when an API call was rejected by the backend's role/branch rules. */
export function isForbiddenError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as ApiEnhancedError).forbidden === true || (error as ApiEnhancedError).status === 403)
  )
}
