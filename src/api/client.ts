import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/utils/env'
import { storage } from '@/utils/storage'
import type { ApiErrorResponse } from '@/types/api'

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

    const enhancedError = new Error(message) as Error & {
      status?: number
      errors?: Record<string, string[]>
      raw?: ApiErrorResponse
    }

    enhancedError.status = status
    enhancedError.errors = data?.errors
    enhancedError.raw = data

    return Promise.reject(enhancedError)
  }
)
