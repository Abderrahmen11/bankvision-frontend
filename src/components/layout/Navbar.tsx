import React, { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Settings,
  Shield,
  LogOut,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { ROLE_CONFIGS } from '@/types/user'
import './Navbar.css'

interface NavbarProps {
  onOpenMobileSidebar: () => void
}

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'warning' | 'info' | 'success'
  read: boolean
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'High-Volume Transaction Flagged',
    message: 'Account #482910 initiated a $125,000 transfer requiring manager review.',
    time: '5m ago',
    type: 'warning',
    read: false,
  },
  {
    id: '2',
    title: 'Daily KYC Verification Cycle Completed',
    message: 'All 48 customer verifications processed successfully.',
    time: '42m ago',
    type: 'success',
    read: false,
  },
  {
    id: '3',
    title: 'Regulatory Compliance Audit',
    message: 'Quarterly compliance log export is ready for auditor download.',
    time: '2h ago',
    type: 'info',
    read: true,
  },
]

// Route metadata map for Page Titles and Breadcrumbs
const ROUTE_META: Record<string, { title: string; category: string }> = {
  '/dashboard': { title: 'Operational Dashboard', category: 'Core Banking' },
  '/customers': { title: 'Customer Management', category: 'Core Banking' },
  '/accounts': { title: 'Account Portfolio', category: 'Core Banking' },
  '/transactions': { title: 'Transaction Ledger', category: 'Core Banking' },
  '/loans': { title: 'Loan Origination & Servicing', category: 'Core Banking' },
  '/branches': { title: 'Branch Oversight', category: 'Management' },
  '/users': { title: 'User & Access Governance', category: 'Administration' },
  '/alerts': { title: 'Risk & Fraud Alerts', category: 'Risk & Compliance' },
  '/audit-logs': { title: 'Audit Trail & Event Logs', category: 'Risk & Compliance' },
  '/reports': { title: 'Financial Intelligence', category: 'Analytics' },
  '/risk-analysis': { title: 'Risk Exposure Modeling', category: 'Analytics' },
  '/profile': { title: 'Staff Profile & Credentials', category: 'Account' },
  '/settings': { title: 'System & Security Settings', category: 'Account' },
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Compute breadcrumbs and title
  const currentPath = location.pathname
  const routeInfo = ROUTE_META[currentPath] || {
    title: currentPath.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Dashboard',
    category: 'BankVision',
  }

  // Handle outside click to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const roleConfig = user?.role ? ROLE_CONFIGS[user.role] : null

  return (
    <header className="bankvision-navbar">
      {/* Left Section: Mobile Toggle, Title & Breadcrumbs */}
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-page-info">
          <nav className="navbar-breadcrumbs" aria-label="Breadcrumb">
            <span className="breadcrumb-root">BankVision</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-category">{routeInfo.category}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{routeInfo.title}</span>
          </nav>
          <h1 className="navbar-page-title">{routeInfo.title}</h1>
        </div>
      </div>

      {/* Middle Section: Global Search Bar */}
      <div className="navbar-center">
        <div className="navbar-search-wrapper">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search accounts, customers, transactions, or routing numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="search-shortcut-badge">
            <span>⌘K</span>
          </div>
        </div>
      </div>

      {/* Right Section: Actions, Notifications, Theme, Profile */}
      <div className="navbar-right">
        {/* Theme Toggle Button */}
        <button
          type="button"
          className="navbar-action-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle application theme"
        >
          {theme === 'dark' ? <Sun size={18} className="theme-icon sun" /> : <Moon size={18} className="theme-icon moon" />}
        </button>

        {/* Notifications Dropdown Container */}
        <div className="navbar-dropdown-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`navbar-action-btn notif-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-panel notif-dropdown-panel animate-fade-in">
              <div className="dropdown-header">
                <div className="notif-title-group">
                  <h3 className="dropdown-title">System Alerts</h3>
                  {unreadCount > 0 && <span className="unread-pill">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-read-btn"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No new notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                    >
                      <div className={`notif-type-icon notif-${notif.type}`}>
                        {notif.type === 'warning' && <AlertTriangle size={15} />}
                        {notif.type === 'success' && <CheckCheck size={15} />}
                        {notif.type === 'info' && <Info size={15} />}
                      </div>
                      <div className="notif-content">
                        <div className="notif-item-header">
                          <span className="notif-item-title">{notif.title}</span>
                          <span className="notif-time">
                            <Clock size={11} /> {notif.time}
                          </span>
                        </div>
                        <p className="notif-message">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="dropdown-footer">
                <Link
                  to="/alerts"
                  className="dropdown-footer-link"
                  onClick={() => setShowNotifications(false)}
                >
                  View all compliance alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="navbar-dropdown-wrapper" ref={userMenuRef}>
          <button
            type="button"
            className={`navbar-user-btn ${showUserMenu ? 'active' : ''}`}
            onClick={() => setShowUserMenu((prev) => !prev)}
            aria-label="User Account Menu"
            aria-expanded={showUserMenu}
          >
            <div className="navbar-user-avatar">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'BV'}
            </div>
            <div className="navbar-user-details desktop-only">
              <span className="navbar-user-name">{user?.name || 'Staff Member'}</span>
              <span className="navbar-user-role">{roleConfig?.label || user?.role || 'Staff'}</span>
            </div>
            <ChevronDown size={14} className="navbar-user-chevron desktop-only" />
          </button>

          {showUserMenu && (
            <div className="dropdown-panel user-dropdown-panel animate-fade-in">
              <div className="user-dropdown-header">
                <p className="user-dropdown-name">{user?.name || 'Authorized Staff'}</p>
                <p className="user-dropdown-email">{user?.email || 'staff@bankvision.internal'}</p>
                <div
                  className="user-dropdown-badge"
                  style={{
                    color: roleConfig?.badgeColor || 'var(--primary-400)',
                    backgroundColor: roleConfig?.badgeBg || 'rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <Shield size={12} />
                  <span>{roleConfig?.label || user?.role}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <div className="user-dropdown-menu-list">
                <Link
                  to="/dashboard"
                  className="user-dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserIcon size={16} />
                  <span>My Profile & Station</span>
                </Link>
                <Link
                  to="/audit-logs"
                  className="user-dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Shield size={16} />
                  <span>Security & Activity Trail</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="user-dropdown-item"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  <span>Preferences</span>
                </Link>
              </div>

              <div className="dropdown-divider" />

              <div className="user-dropdown-footer">
                <button
                  type="button"
                  className="user-dropdown-logout-btn"
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
