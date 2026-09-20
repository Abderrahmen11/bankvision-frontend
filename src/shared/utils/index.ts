// Shared utilities.
export * from './currency'
export * from './localeFormat'
export * from './storage'

export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
  }
  return error instanceof Error ? error.message : fallback
}
