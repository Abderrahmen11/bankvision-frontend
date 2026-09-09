import React from 'react'
import { NavLink } from 'react-router-dom'
import { ShieldAlert, UserCheck, Flame } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const AlertNavTabs: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role ?? 'csr'

  // Determine if AML tab is accessible (csr cannot access deep analytical/AML dashboards)
  const canAccessAml = ['admin', 'manager', 'compliance', 'analyst', 'auditor'].includes(role)

  return (
    <div className="al-tabs">
      <NavLink
        to="/alerts"
        end
        className={({ isActive }) => `al-tab ${isActive ? 'active' : ''}`}
      >
        <ShieldAlert size={16} />
        <span>Active Alerts</span>
        <span className="al-tab-badge">Live</span>
      </NavLink>

      <NavLink
        to="/alerts/kyc"
        className={({ isActive }) => `al-tab ${isActive ? 'active' : ''}`}
      >
        <UserCheck size={16} />
        <span>KYC Verification Queue</span>
        <span className="al-tab-badge">Queue</span>
      </NavLink>

      {canAccessAml && (
        <NavLink
          to="/alerts/aml"
          className={({ isActive }) => `al-tab ${isActive ? 'active' : ''}`}
        >
          <Flame size={16} />
          <span>AML Risk Dashboard</span>
          <span className="al-tab-badge">Surveillance</span>
        </NavLink>
      )}
    </div>
  )
}
