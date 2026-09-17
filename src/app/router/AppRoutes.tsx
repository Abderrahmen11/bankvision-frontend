import { useAuth } from '@/shared/hooks'
import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import type { UserRole } from '@/shared/types/user'
import { MainLayout } from '@/layouts/MainLayout'
import {
  CORE_BANKING_ROLES,
  BRANCH_ROLES,
  USER_MGMT_ROLES,
  ALERT_ROLES,
  AML_ROLES,
  AUDIT_ROLES,
  ANALYTICS_ROLES,
  ADMIN_ONLY_ROLES,
  ALL_ROLES,
} from '@/shared/config/roles'
const LandingPage = lazy(() => import('@/features/landing').then(m => ({ default: m.LandingPage })))
const DocsPage = lazy(() => import('@/features/docs').then(m => ({ default: m.DocsPage })))
const LoginPage = lazy(() => import('@/features/auth').then(m => ({ default: m.LoginPage })))
const UnauthorizedPage = lazy(() => import('@/features/auth').then(m => ({ default: m.UnauthorizedPage })))
const NotFoundPage = lazy(() => import('@/features/errors').then(m => ({ default: m.NotFoundPage })))
const RoleDashboard = lazy(() => import('@/features/dashboard').then(m => ({ default: m.RoleDashboard })))
const UserListPage = lazy(() => import('@/features/users').then(m => ({ default: m.UserListPage })))
const UserDetailPage = lazy(() => import('@/features/users').then(m => ({ default: m.UserDetailPage })))
const CustomerListPage = lazy(() => import('@/features/customers').then(m => ({ default: m.CustomerListPage })))
const CustomerDetailPage = lazy(() => import('@/features/customers').then(m => ({ default: m.CustomerDetailPage })))
const AccountListPage = lazy(() => import('@/features/accounts').then(m => ({ default: m.AccountListPage })))
const AccountDetailPage = lazy(() => import('@/features/accounts').then(m => ({ default: m.AccountDetailPage })))
const TransactionListPage = lazy(() => import('@/features/transactions').then(m => ({ default: m.TransactionListPage })))
const TransactionDetailPage = lazy(() => import('@/features/transactions').then(m => ({ default: m.TransactionDetailPage })))
const LoanListPage = lazy(() => import('@/features/loans').then(m => ({ default: m.LoanListPage })))
const LoanDetailPage = lazy(() => import('@/features/loans').then(m => ({ default: m.LoanDetailPage })))
const AlertListPage = lazy(() => import('@/features/alerts').then(m => ({ default: m.AlertListPage })))
const AlertDetailPage = lazy(() => import('@/features/alerts').then(m => ({ default: m.AlertDetailPage })))
const KycQueuePage = lazy(() => import('@/features/alerts').then(m => ({ default: m.KycQueuePage })))
const AmlDashboardPage = lazy(() => import('@/features/alerts').then(m => ({ default: m.AmlDashboardPage })))
const BranchListPage = lazy(() => import('@/features/branches').then(m => ({ default: m.BranchListPage })))
const BranchDetailPage = lazy(() => import('@/features/branches').then(m => ({ default: m.BranchDetailPage })))
const ReportsDashboardPage = lazy(() => import('@/features/reports').then(m => ({ default: m.ReportsDashboardPage })))
const SettingsPage = lazy(() => import('@/features/settings').then(m => ({ default: m.SettingsPage })))
const AuditLogListPage = lazy(() => import('@/features/audit').then(m => ({ default: m.AuditLogListPage })))
const AuditLogDetailPage = lazy(() => import('@/features/audit').then(m => ({ default: m.AuditLogDetailPage })))

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
  children?: React.ReactNode
}

/**
 * Logical Route Guard for Authenticated / Protected Routes
 * Handles initialization, authentication checks, and role restrictions.
 * If user lacks required role, redirects to /unauthorized (or custom redirectTo).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectTo = '/unauthorized',
  children,
}) => {
  const { isAuthenticated, isInitialized, user, hasAnyRole } = useAuth()
  const location = useLocation()

  if (!isInitialized) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectTo} replace />
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
const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
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

const RouteFallback = () => (
  <div className="route-fallback" role="status" aria-label="Loading page">
    <span className="route-fallback-spinner" />
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public Landing Page */}
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
        {/* Core Dashboard: dynamically renders Admin, Manager, Compliance, Analyst, CSR, or Auditor view */}
        <Route path="/dashboard" element={<RoleDashboard />} />

        {/* Core Banking Modules */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <CustomerListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <AccountListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/:id"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <AccountDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <TransactionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <TransactionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <LoanListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans/:id"
          element={
            <ProtectedRoute allowedRoles={CORE_BANKING_ROLES}>
              <LoanDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Operations & Management */}
        <Route
          path="/branches"
          element={
            <ProtectedRoute allowedRoles={BRANCH_ROLES}>
              <BranchListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches/:id"
          element={
            <ProtectedRoute allowedRoles={BRANCH_ROLES}>
              <BranchDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={USER_MGMT_ROLES}>
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute allowedRoles={USER_MGMT_ROLES}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Risk & Audit */}
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={ALERT_ROLES}>
              <AlertListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/:id"
          element={
            <ProtectedRoute allowedRoles={ALERT_ROLES}>
              <AlertDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/kyc"
          element={
            <ProtectedRoute allowedRoles={ALERT_ROLES}>
              <KycQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc-queue"
          element={<Navigate to="/alerts/kyc" replace />}
        />
        <Route
          path="/alerts/aml"
          element={
            <ProtectedRoute allowedRoles={AML_ROLES}>
              <AmlDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aml-dashboard"
          element={<Navigate to="/alerts/aml" replace />}
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={AUDIT_ROLES}>
              <AuditLogListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs/:id"
          element={
            <ProtectedRoute allowedRoles={AUDIT_ROLES}>
              <AuditLogDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Analytics & Insights - /reports was a duplicate of /risk-analysis
            and has been removed; direct visits are redirected. */}
        <Route
          path="/reports"
          element={<Navigate to="/risk-analysis" replace />}
        />
        <Route
          path="/risk-analysis"
          element={
            <ProtectedRoute allowedRoles={ANALYTICS_ROLES}>
              <ReportsDashboardPage defaultTab="risk" />
            </ProtectedRoute>
          }
        />

        {/* Profile & System Configuration - every role manages Profile & Preferences;
            the Settings page hides Security / Notifications / System tabs for non-admins */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={ALL_ROLES}>
              <SettingsPage defaultTab="profile" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={ALL_ROLES}>
              <SettingsPage defaultTab="preferences" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/system"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY_ROLES}>
              <SettingsPage defaultTab="system" />
            </ProtectedRoute>
          }
        />

        {/* 403 Forbidden Feedback Route */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* 404 Not Found - renders for any unmatched route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
