import React from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/user'
import { MainLayout } from '@/layouts/MainLayout'
import { LandingPage } from '@/pages/landing/LandingPage'
import { DocsPage } from '@/pages/docs/DocsPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage'
import { RoleDashboard } from '@/pages/dashboard/RoleDashboard'
import { DashboardPlaceholder } from '@/components/common/DashboardPlaceholder'
import { UserListPage } from '@/pages/users/UserListPage'
import { UserDetailPage } from '@/pages/users/UserDetailPage'
import { CustomerListPage } from '@/pages/customers/CustomerListPage'
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage'
import { AccountListPage } from '@/pages/accounts/AccountListPage'
import { AccountDetailPage } from '@/pages/accounts/AccountDetailPage'
import { TransactionListPage } from '@/pages/transactions/TransactionListPage'
import { TransactionDetailPage } from '@/pages/transactions/TransactionDetailPage'
import { LoanListPage } from '@/pages/loans/LoanListPage'
import { LoanDetailPage } from '@/pages/loans/LoanDetailPage'
import { AlertListPage } from '@/pages/alerts/AlertListPage'
import { AlertDetailPage } from '@/pages/alerts/AlertDetailPage'
import { KycQueuePage } from '@/pages/alerts/KycQueuePage'
import { AmlDashboardPage } from '@/pages/alerts/AmlDashboardPage'
import { BranchListPage } from '@/pages/branches/BranchListPage'
import { BranchDetailPage } from '@/pages/branches/BranchDetailPage'
import { ReportsDashboardPage } from '@/pages/reports/ReportsDashboardPage'

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
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
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
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <CustomerListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <AccountListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <AccountDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <TransactionListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <TransactionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <LoanListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor']}>
              <LoanDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Operations & Management */}
        <Route
          path="/branches"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'analyst', 'auditor', 'compliance']}>
              <BranchListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'analyst', 'auditor', 'compliance']}>
              <BranchDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <UserListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Risk & Audit */}
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor']}>
              <AlertListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor']}>
              <AlertDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/kyc"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor']}>
              <KycQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc-queue"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor']}>
              <KycQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/aml"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'analyst', 'auditor']}>
              <AmlDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aml-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'compliance', 'analyst', 'auditor']}>
              <AmlDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'compliance', 'auditor']}>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* Analytics & Insights */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'analyst', 'auditor', 'compliance']}>
              <ReportsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/risk-analysis"
          element={
            <ProtectedRoute allowedRoles={['admin', 'analyst', 'compliance', 'auditor', 'manager']}>
              <ReportsDashboardPage defaultTab="risk" />
            </ProtectedRoute>
          }
        />

        {/* Profile & System Configuration */}
        <Route path="/profile" element={<DashboardPlaceholder />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* 403 Forbidden Feedback Route */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
