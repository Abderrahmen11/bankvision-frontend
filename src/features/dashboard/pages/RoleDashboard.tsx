import { useAuth } from '@/shared/hooks'
import React from 'react'
import { DashboardPage } from './DashboardPage'

/**
 * Entry route for /dashboard - renders the modular widget dashboard for the
 * authenticated user's role. The RBAC persona switcher was removed; each
 * staff member sees the dashboard that matches their actual assigned role.
 */
export const RoleDashboard: React.FC = () => {
  const { role } = useAuth()

  return <DashboardPage key={role} />
}
