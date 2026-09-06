import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  HandCoins,
  Building2,
  UserCog,
  ShieldAlert,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  LogOut,
  ChevronLeft,
  Landmark,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_CONFIGS, type UserRole } from '@/types/user'
import './Sidebar.css'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  allowedRoles?: UserRole[]
  badge?: string
  badgeVariant?: 'primary' | 'warning' | 'danger' | 'info'
}

interface NavSection {
  title: string
  collapsible?: boolean
  defaultExpanded?: boolean
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Banking',
    defaultExpanded: true,
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        name: 'Customers',
        path: '/customers',
        icon: Users,
        allowedRoles: ['admin', 'manager', 'csr'],
      },
      {
        name: 'Accounts',
        path: '/accounts',
        icon: CreditCard,
        allowedRoles: ['admin', 'manager', 'csr'],
      },
      {
        name: 'Transactions',
        path: '/transactions',
        icon: ArrowLeftRight,
        allowedRoles: ['admin', 'manager', 'csr', 'compliance'],
      },
      {
        name: 'Loan Portfolio',
        path: '/loans',
        icon: HandCoins,
        allowedRoles: ['admin', 'manager', 'csr'],
      },
    ],
  },
  {
    title: 'Operations & Management',
    defaultExpanded: true,
    items: [
      {
        name: 'Branches',
        path: '/branches',
        icon: Building2,
        allowedRoles: ['admin', 'manager'],
      },
      {
        name: 'User Management',
        path: '/users',
        icon: UserCog,
        allowedRoles: ['admin', 'manager'],
      },
    ],
  },
  {
    title: 'Risk & Audit',
    defaultExpanded: true,
    items: [
      {
        name: 'KYC & AML Alerts',
        path: '/alerts',
        icon: ShieldAlert,
        allowedRoles: ['admin', 'manager', 'compliance'],
        badge: 'Live',
        badgeVariant: 'warning',
      },
      {
        name: 'Audit Logs',
        path: '/audit-logs',
        icon: FileSpreadsheet,
        allowedRoles: ['admin', 'compliance', 'auditor'],
      },
    ],
  },
  {
    title: 'Analytics & Insights',
    defaultExpanded: true,
    items: [
      {
        name: 'Financial Reports',
        path: '/reports',
        icon: BarChart3,
        allowedRoles: ['admin', 'manager', 'analyst'],
      },
      {
        name: 'Risk Modeling',
        path: '/risk-analysis',
        icon: TrendingUp,
        allowedRoles: ['admin', 'analyst'],
      },
    ],
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, hasAnyRole, logout } = useAuth()
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }))
  }

  const roleConfig = user?.role ? ROLE_CONFIGS[user.role] : null

  // Filter sections and items by user roles
  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.allowedRoles || item.allowedRoles.length === 0) return true
      return hasAnyRole(item.allowedRoles)
    }),
  })).filter((section) => section.items.length > 0)

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside
        className={`bankvision-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo-icon">
              <Landmark size={22} className="brand-icon-svg" />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-name">BankVision</span>
                <span className="brand-tag">Core Banking</span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            className="sidebar-collapse-btn desktop-only"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar-close-btn mobile-only"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {filteredSections.map((section) => {
            const isSectionCollapsed = collapsedSections[section.title] ?? false

            return (
              <div key={section.title} className="nav-section">
                {!isCollapsed && (
                  <button
                    type="button"
                    className="section-header-btn"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={!isSectionCollapsed}
                  >
                    <span className="section-title">{section.title}</span>
                    <span className="section-chevron">
                      {isSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                )}

                {(!isSectionCollapsed || isCollapsed) && (
                  <ul className="nav-list">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <li key={item.path} className="nav-item">
                          <NavLink
                            to={item.path}
                            onClick={() => {
                              if (isMobileOpen) onCloseMobile()
                            }}
                            className={({ isActive }) =>
                              `nav-link ${isActive ? 'active' : ''}`
                            }
                            title={isCollapsed ? item.name : undefined}
                          >
                            <span className="nav-icon">
                              <Icon size={19} />
                            </span>
                            {!isCollapsed && (
                              <>
                                <span className="nav-label">{item.name}</span>
                                {item.badge && (
                                  <span
                                    className={`nav-badge badge-${
                                      item.badgeVariant || 'primary'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile Snippet */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="user-avatar" title={user?.name || 'User Avatar'}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'BV'}
            </div>

            {!isCollapsed && (
              <div className="user-info">
                <span className="user-name" title={user?.name}>
                  {user?.name || 'Authorized Staff'}
                </span>
                <span
                  className="user-role-badge"
                  style={{
                    color: roleConfig?.badgeColor || 'var(--primary-400)',
                    backgroundColor: roleConfig?.badgeBg || 'rgba(99, 102, 241, 0.15)',
                  }}
                >
                  {roleConfig?.label || user?.role || 'Staff'}
                </span>
              </div>
            )}

            {!isCollapsed && (
              <button
                type="button"
                className="user-logout-btn"
                onClick={logout}
                title="Sign out of BankVision"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
