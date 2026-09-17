import { useAuth } from '@/shared/hooks'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ArrowLeftRight, ShieldAlert, Menu } from 'lucide-react'
import type { UserRole } from '@/shared/types/user'

interface BottomNavItem {
  to: string
  label: string
  icon: React.ReactNode
  allowedRoles?: UserRole[]
}

const ITEMS: BottomNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { to: '/customers', label: 'Clients', icon: <Users size={20} /> },
  { to: '/transactions', label: 'Ledger', icon: <ArrowLeftRight size={20} /> },
  {
    to: '/alerts',
    label: 'Alerts',
    icon: <ShieldAlert size={20} />,
    allowedRoles: ['admin', 'manager', 'compliance', 'csr', 'analyst', 'auditor'],
  },
]

/**
 * Thumb-friendly bottom navigation bar - rendered only below 768px.
 * The last slot opens the slide-in drawer (full navigation).
 */
export const BottomNav: React.FC<{ onOpenMobileSidebar: () => void }> = ({ onOpenMobileSidebar }) => {
  const { hasAnyRole } = useAuth()

  const visible = ITEMS.filter(
    (item) => !item.allowedRoles || hasAnyRole(item.allowedRoles)
  )

  return (
    <nav className="bottom-nav" aria-label="Primary mobile navigation">
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onOpenMobileSidebar}
        aria-label="Open full menu"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  )
}
