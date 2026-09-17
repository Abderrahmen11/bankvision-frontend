import { useAuth, useMediaQuery, useTheme } from '@/shared/hooks'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  ArrowLeft,
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
import { notificationsApi } from '@/shared/api'
import { useGlobalSearch } from '@/features/search'
import { MobileSheet } from '@/shared/components/MobileSheet'
import { GlobalSearchResults } from '@/features/search'
import { alertsApi } from '@/features/alerts/api/alerts'
import { closeSearchOverlay, useSearchOverlayStore } from '@/store/searchOverlay'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Alert } from '@/features/alerts/types'
import type { User, RoleConfig } from '@/shared/types/user'
import './Navbar.css'

interface NavbarProps {
  onOpenMobileSidebar: () => void
}

interface NotificationItem {
  id: number
  title: string
  message: string
  time: string
  type: 'warning' | 'info' | 'success'
  read: boolean
  /** In-app notification id (notifications table); alerts use alert id */
  notificationId?: number
  /** In-app route the notification should open */
  link?: string | null
}

function alertSeverityToType(severity: Alert['severity']): NotificationItem['type'] {
  if (severity === 'high') return 'warning'
  if (severity === 'medium') return 'info'
  return 'success'
}

function formatAlertTitle(alert: Alert): string {
  return alert.alert_number ? `${alert.alert_number} · ${alert.alert_type.replace(/_/g, ' ')}` : alert.alert_type
}

function relativeTime(timestamp?: string | null): string {
  if (!timestamp) return ''
  const then = new Date(timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T') + 'Z')
  const diffMs = Date.now() - then.getTime()
  if (Number.isNaN(diffMs)) return ''
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

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

const NOTIFICATION_PAGE_SIZE = 5
/** Must match the mobile.css sheet breakpoint (max-width: 767px). */
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

/** Notification panel body - shared by the desktop dropdown and mobile sheet. */
const NotificationsPanelBody: React.FC<{
  notifications: NotificationItem[]
  openAlertsTotal: number
  unreadCount: number
  onMarkAllRead: () => void
  onNotificationClick: (notif: NotificationItem) => void
  onClose: () => void
}> = ({ notifications, openAlertsTotal, unreadCount, onMarkAllRead, onNotificationClick, onClose }) => (
  <>
    <div className="dropdown-header">
      <div className="notif-title-group">
        <h3 className="dropdown-title">System Alerts</h3>
        {openAlertsTotal > 0 && <span className="unread-pill">{openAlertsTotal} open</span>}
      </div>
      {unreadCount > 0 && (
        <button
          type="button"
          className="mark-read-btn"
          onClick={onMarkAllRead}
        >
          <CheckCheck size={14} />
          <span>Mark all read</span>
        </button>
      )}
    </div>

    <div className="notif-list">
      {notifications.length === 0 ? (
        <div className="notif-empty">No open alerts</div>
      ) : (
        notifications.map((notif) => (
          <div
            key={`${notif.notificationId ?? 'alert'}-${notif.id}`}
            className={`notif-item ${notif.read ? 'read' : 'unread'} notif-item-clickable`}
            role="button"
            tabIndex={0}
            onClick={() => onNotificationClick(notif)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNotificationClick(notif)
            }}
          >
            <div className={`notif-type-icon notif-${notif.type}`}>
              {notif.type === 'warning' && <AlertTriangle size={15} />}
              {notif.type === 'success' && <CheckCheck size={15} />}
              {notif.type === 'info' && <Info size={15} />}
            </div>
            <div className="notif-content">
              <div className="notif-item-header">
                <span className="notif-item-title">{notif.title}</span>
                {notif.time && (
                  <span className="notif-time">
                    <Clock size={11} /> {notif.time}
                  </span>
                )}
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
        onClick={onClose}
      >
        View all compliance alerts →
      </Link>
    </div>
  </>
)

interface UserMenuPanelBodyProps {
  user: User | null
  roleConfig: RoleConfig | null
  onClose: () => void
  onLogout: () => void
}

/** User menu panel body - shared by the desktop dropdown and mobile sheet. */
const UserMenuPanelBody: React.FC<UserMenuPanelBodyProps> = ({
  user,
  roleConfig,
  onClose,
  onLogout,
}) => (
  <>
    <div className="user-dropdown-header">
      <p className="user-dropdown-name">{user?.name || 'Authorized Staff'}</p>
      {user?.email && <p className="user-dropdown-email">{user.email}</p>}
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
      <Link to="/profile" className="user-dropdown-item" onClick={onClose}>
        <UserIcon size={16} />
        <span>My Profile & Station</span>
      </Link>
      <Link to="/audit-logs" className="user-dropdown-item" onClick={onClose}>
        <Shield size={16} />
        <span>Security & Activity Trail</span>
      </Link>
      <Link to="/settings" className="user-dropdown-item" onClick={onClose}>
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
          onClose()
          onLogout()
        }}
      >
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </div>
  </>
)

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const { user, roleConfig, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [readAlertIds, setReadAlertIds] = useState<Set<number>>(() => new Set())

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const openSearchOverlay = useSearchOverlayStore((s) => s.open)

  // Pure-frontend search over the static section directory - instant, no API.
  const {
    query,
    setQuery,
    clearQuery,
    groups,
    categories,
    activeIndex,
    setActiveIndex,
    indexOfItem,
    handleSearchKeyDown,
  } = useGlobalSearch()

  // ⌘K on Apple platforms, Ctrl K elsewhere
  const shortcutHint = useMemo(
    () => (/mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    []
  )

  // Load notifications: in-app records + open compliance alerts via React Query
  const alertsQuery = useQuery({
    queryKey: ['navbar', 'alerts'],
    queryFn: () =>
      alertsApi.list({ status: 'open', per_page: NOTIFICATION_PAGE_SIZE, sort_by: 'created_at', sort_direction: 'desc' }),
    staleTime: 30_000,
  })

  const inAppQuery = useQuery({
    queryKey: ['navbar', 'notifications'],
    queryFn: () => notificationsApi.list(NOTIFICATION_PAGE_SIZE),
    staleTime: 30_000,
  })

  const openAlertsTotal = alertsQuery.data?.meta?.total ?? alertsQuery.data?.data?.length ?? 0

  const notifications = useMemo<NotificationItem[]>(() => {
    const inApp: NotificationItem[] = (inAppQuery.data?.notifications ?? []).map((n) => ({
      id: n.id,
      notificationId: n.id,
      title: n.title,
      message: n.message ?? '',
      time: relativeTime(n.created_at),
      type: (['warning', 'success', 'danger'].includes(n.type) ? (n.type === 'danger' ? 'warning' : n.type) : 'info') as NotificationItem['type'],
      read: Boolean(n.read_at),
      link: n.link,
    }))

    const alertItems: NotificationItem[] = (alertsQuery.data?.data ?? []).map((alert) => ({
      id: alert.id,
      title: formatAlertTitle(alert),
      message: alert.description,
      time: relativeTime(alert.created_at),
      type: alertSeverityToType(alert.severity),
      read: readAlertIds.has(alert.id),
      link: `/alerts/${alert.id}`,
    }))

    return [...inApp, ...alertItems]
  }, [inAppQuery.data, alertsQuery.data, readAlertIds])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Compute breadcrumbs and title
  const currentPath = location.pathname
  const routeInfo = ROUTE_META[currentPath] || {
    title: currentPath.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Dashboard',
    category: 'BankVision',
  }

  // Autofocus is handled inside GlobalSearchOverlay; the store owns the
  // overlay's open state and the GlobalSearchController owns Ctrl+K.

  const navigateToResult = (route: string) => {
    setShowSearchResults(false)
    closeSearchOverlay()
    clearQuery()
    navigate(route)
  }

  const closeSearch = () => {
    setShowSearchResults(false)
    closeSearchOverlay()
    // Blur so the next focus/click reopens the dropdown cleanly (otherwise the
    // input stays focused and typing never re-fires onFocus)
    searchInputRef.current?.blur()
  }

  // Handle outside click to close menus (desktop dropdowns only - the mobile
  // sheets are portaled to <body> and dismiss via overlay, close button or swipe)
  useEffect(() => {
    if (isMobile) return

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile])

  const markAllAsRead = () => {
    if (alertsQuery.data?.data) {
      setReadAlertIds(new Set(alertsQuery.data.data.map((a) => a.id)))
    }
    void notificationsApi
      .markAllRead()
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['navbar', 'notifications'] })
      })
      .catch(() => undefined)
  }

  // Open a notification: navigate to its target (alert detail by default)
  const handleNotificationClick = (notif: NotificationItem) => {
    setShowNotifications(false)
    if (notif.notificationId !== undefined) {
      void notificationsApi
        .markRead(notif.notificationId)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ['navbar', 'notifications'] })
        })
        .catch(() => undefined)
    } else {
      setReadAlertIds((prev) => new Set(prev).add(notif.id))
    }
    navigate(notif.link || `/alerts/${notif.id}`)
  }

  const seeAllCustomers = () => {
    const trimmed = query.trim()
    setShowSearchResults(false)
    closeSearchOverlay()
    clearQuery()
    navigate(trimmed ? `/customers?search=${encodeURIComponent(trimmed)}` : '/customers')
  }

  const customersGroup = groups.find((g) => g.group === 'Core Banking' && g.items.some((i) => i.id === 'customers'))

  const header = (
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

        {/* Mobile back button - replaces breadcrumbs below 768px */}
        <button
          type="button"
          className="navbar-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
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

      {/* Middle Section: Global Search Bar (desktop ≥1024px) */}
      <div className="navbar-center">
        <div className="navbar-search-wrapper" ref={searchRef}>
          <Search size={17} className="search-icon" />
          <input
            name='search'
            ref={searchInputRef}
            type="text"
            className="navbar-search-input"
            placeholder="Search sections, settings & pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={(e) =>
              handleSearchKeyDown(e, {
                onEscape: closeSearch,
                onOpen: navigateToResult,
              })
            }
            aria-label="Global search"
            role="combobox"
            aria-expanded={showSearchResults}
            aria-controls="global-search-results"
          />
          <div className="search-shortcut-badge">
            <span>{shortcutHint}</span>
          </div>

          {showSearchResults && (
            <div
              id="global-search-results"
              className="navbar-search-results animate-fade-in"
            >
              <GlobalSearchResults
                query={query}
                groups={groups}
                categories={categories}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                indexOfItem={indexOfItem}
                onNavigate={navigateToResult}
              />
              {customersGroup && (
                <div className="search-groups-footer">
                  <button type="button" className="search-result-all" onClick={seeAllCustomers}>
                    See all customer results for “{query.trim()}” →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Actions, Notifications, Theme, Profile */}
      <div className="navbar-right">
        {/* Search button - mobile/tablet (inline bar is hidden below 1024px) */}
        <button
          type="button"
          className="navbar-action-btn search-mobile-btn"
          onClick={openSearchOverlay}
          title={`Search the bank (${shortcutHint})`}
          aria-label="Search"
        >
          <Search size={18} />
        </button>

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

          {showNotifications && (isMobile ? (
            <MobileSheet title="System Alerts" onClose={() => setShowNotifications(false)}>
              <NotificationsPanelBody
                notifications={notifications}
                openAlertsTotal={openAlertsTotal}
                unreadCount={unreadCount}
                onMarkAllRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
                onClose={() => setShowNotifications(false)}
              />
            </MobileSheet>
          ) : (
            <div className="dropdown-panel notif-dropdown-panel animate-fade-in">
              <NotificationsPanelBody
                notifications={notifications}
                openAlertsTotal={openAlertsTotal}
                unreadCount={unreadCount}
                onMarkAllRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
                onClose={() => setShowNotifications(false)}
              />
            </div>
          ))}
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

          {showUserMenu && (isMobile ? (
            <MobileSheet title="Account" onClose={() => setShowUserMenu(false)}>
              <UserMenuPanelBody
                user={user}
                roleConfig={roleConfig}
                onClose={() => setShowUserMenu(false)}
                onLogout={logout}
              />
            </MobileSheet>
          ) : (
            <div className="dropdown-panel user-dropdown-panel animate-fade-in">
              <UserMenuPanelBody
                user={user}
                roleConfig={roleConfig}
                onClose={() => setShowUserMenu(false)}
                onLogout={logout}
              />
            </div>
          ))}
        </div>
      </div>
    </header>
  )

  // The full-screen search overlay is owned by GlobalSearchController (store:
  // store/searchOverlay.ts) so it is also reachable from public pages via Ctrl+K.
  return header
}
