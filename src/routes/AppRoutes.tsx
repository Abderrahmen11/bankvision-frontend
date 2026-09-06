import React from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/user'
import { MainLayout } from '@/layouts/MainLayout'
import { LandingPage } from '@/pages/landing/LandingPage'
import { DocsPage } from '@/pages/docs/DocsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPlaceholder } from '@/components/common/DashboardPlaceholder'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: React.ReactNode
}

/**
 * Logical Route Guard for Authenticated / Protected Routes
 * Handles initialization, authentication checks, and role restrictions with zero UI rendering.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isInitialized, user, hasAnyRole } = useAuth()
  const location = useLocation()

  if (!isInitialized) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

interface GuestRouteProps {
  children?: React.ReactNode
}

/**
 * Logical Route Guard for Guest / Public Routes (e.g. /login)
 * Redirects authenticated users to destination or role-default route with zero UI rendering.
 */
export const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized, roleConfig } = useAuth()
  const location = useLocation()

  if (!isInitialized) {
    return null
  }

  if (isAuthenticated) {
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      roleConfig?.defaultRoute ||
      '/dashboard'
    return <Navigate to={from} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page (accessible to both guest and authenticated users) */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Documentation & FAQ Page */}
      <Route path="/docs" element={<DocsPage />} />

      {/* Public / Guest Login Route */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />


      {/* Protected Main Application Routes wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPlaceholder />} />
        <Route path="/customers" element={<DashboardPlaceholder />} />
        <Route path="/accounts" element={<DashboardPlaceholder />} />
        <Route path="/transactions" element={<DashboardPlaceholder />} />
        <Route path="/loans" element={<DashboardPlaceholder />} />
        <Route path="/branches" element={<DashboardPlaceholder />} />
        <Route path="/users" element={<DashboardPlaceholder />} />
        <Route path="/alerts" element={<DashboardPlaceholder />} />
        <Route path="/audit-logs" element={<DashboardPlaceholder />} />
        <Route path="/reports" element={<DashboardPlaceholder />} />
        <Route path="/risk-analysis" element={<DashboardPlaceholder />} />
        <Route path="/profile" element={<DashboardPlaceholder />} />
        <Route path="/settings" element={<DashboardPlaceholder />} />
      </Route>

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}


