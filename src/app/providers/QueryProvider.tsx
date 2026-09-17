import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'
import { isForbiddenError } from '@/shared/api'

/**
 * TanStack Query host (Phase: performance).
 *
 * Defaults per the caching spec:
 * - staleTime 60s  → revisiting a page within a minute serves cached data
 *                    instantly (no spinner) while a background refetch runs
 * - gcTime 300s    → unused queries stay in memory for 5 minutes
 * - no refetch on window focus (dashboards poll on their own schedules)
 * - retry once     → transient failures recover, hard failures fail fast
 *
 * Mutations invalidate their feature's query keys, so lists stay correct
 * after create/update/delete.
 *
 * NOTE: queryClient is created via useRef (not module scope) so each
 * provider instance gets its own fresh client — important for test isolation.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 300_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isForbiddenError(error) || (error as { status?: number })?.status === 401) {
                return false
              }
              return failureCount < 1
            },
          },
          mutations: {
            retry: (failureCount, error) => {
              if (isForbiddenError(error) || (error as { status?: number })?.status === 401) {
                return false
              }
              return failureCount < 1
            },
          },
        },
      })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
