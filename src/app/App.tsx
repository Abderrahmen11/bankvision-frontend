import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import toast from 'react-hot-toast'
import { AppRoutes } from '@app/router/AppRoutes'
import { ToastProvider } from '@app/providers/ToastProvider'
import { QueryProvider } from '@app/providers/QueryProvider'
import { GlobalSearchController } from '@/features/search/components/GlobalSearchController'
import { useAuth } from '@/shared/hooks'
import { useAuthStore } from '@/store/useAuthStore'

/** Full-page fallback for uncaught render errors */
function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error ?? 'An unexpected error occurred.')
  return (
    <div role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--rose-500)', marginBottom: '1rem' }}>Something went wrong</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        style={{
          padding: '0.5rem 1.5rem',
          background: 'var(--primary-500)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}

const AppInner: React.FC = () => {
  const { checkAuth } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { checkAuth() }, [])

  return (
    <BrowserRouter>
      {/* Toast Notification Container */}
      <ToastProvider />

      {/* Application Routing */}
      <AppRoutes />

      {/* Global search overlay + Ctrl+K shortcut (works on every page,
          including public landing/docs pages) */}
      <GlobalSearchController />
    </BrowserRouter>
  )
}

export const App: React.FC = () => {
  // Register the global unauthorized & forbidden event listeners here at app bootstrap,
  // keeping it out of the Zustand store factory (which is a module-level
  // side-effect and cannot be removed/re-registered in tests).
  useEffect(() => {
    const unauthorizedHandler = () => {
      useAuthStore.getState().logout().catch(() => undefined)
    }

    const forbiddenHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>
      const message =
        customEvent.detail?.message || 'Access denied. You do not have permission to perform this action.'
      toast.error(message, { id: 'bankvision-forbidden' })
    }

    window.addEventListener('bankvision:unauthorized', unauthorizedHandler)
    window.addEventListener('bankvision:forbidden', forbiddenHandler)

    return () => {
      window.removeEventListener('bankvision:unauthorized', unauthorizedHandler)
      window.removeEventListener('bankvision:forbidden', forbiddenHandler)
    }
  }, [])

  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <QueryProvider>
        <AppInner />
      </QueryProvider>
    </ErrorBoundary>
  )
}
