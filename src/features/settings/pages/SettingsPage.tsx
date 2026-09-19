import { showToast, useAuth } from '@/shared/hooks'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  User,
  Shield,
  Bell,
  Server,
  Palette,
  Settings as SettingsIcon,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settings'
import { useAuthStore } from '@/store/useAuthStore'
import type { UserSettings } from '@/features/settings/types'
import type { UserRole } from '@/shared/types/user'
import {
  getAllowedTabs,
  canAccessTab,
  type SettingsTabId,
} from '../settingsHelpers'
import { ProfileSettingsTab } from '../components/ProfileSettingsTab'
import { SecuritySettingsTab } from '../components/SecuritySettingsTab'
import { NotificationSettingsTab } from '../components/NotificationSettingsTab'
import { SystemConfigTab } from '../components/SystemConfigTab'
import { PreferencesSettingsTab } from '../components/PreferencesSettingsTab'
import './Settings.css'

const TAB_ICONS: Record<SettingsTabId, React.ReactNode> = {
  profile: <User size={16} />,
  security: <Shield size={16} />,
  notifications: <Bell size={16} />,
  system: <Server size={16} />,
  preferences: <Palette size={16} />,
}

interface SettingsPageProps {
  defaultTab?: SettingsTabId
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ defaultTab = 'profile' }) => {
  const { user, roleConfig } = useAuth()
  const role: UserRole = user?.role || 'csr'
  const setUser = useAuthStore((state) => state.setUser)
  const [searchParams, setSearchParams] = useSearchParams()

  const allowedTabs = useMemo(() => getAllowedTabs(role), [role])

  const resolveInitialTab = useCallback(
    (candidate: string | null): SettingsTabId => {
      if (candidate && canAccessTab(role, candidate as SettingsTabId)) {
        return candidate as SettingsTabId
      }
      return allowedTabs.some((t) => t.id === defaultTab) ? defaultTab : allowedTabs[0]?.id || 'profile'
    },
    [role, allowedTabs, defaultTab]
  )

  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => resolveInitialTab(searchParams.get('tab')))
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load the settings bundle (2FA flag, notifications, preferences)
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await settingsApi.getAll()
      setSettings(data)
    } catch (err) {
      console.error('Settings load error:', err)
      showToast.error(err instanceof Error ? err.message : 'Failed to load settings.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    settingsApi
      .getAll()
      .then((data) => {
        if (active) setSettings(data)
      })
      .catch((err) => {
        console.error('Settings load error:', err)
        if (active) showToast.error(err instanceof Error ? err.message : 'Failed to load settings.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId }, { replace: true })
  }

  // Propagate profile edits (name/phone) into the global auth state
  const handleUserUpdated = (updated: typeof user) => {
    if (updated) setUser(updated)
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="st-page">
        <div className="st-card st-denied">
          <div className="st-denied-icon">
            <ShieldAlert size={28} />
          </div>
          <h2>Access Restricted</h2>
          <p>
            Your role ({roleConfig?.label || role}) does not include access to account settings. Please contact
            your system administrator if you believe this is a mistake.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="st-page">
      {/* ── Page Header ── */}
      <header className="st-header">
        <div className="st-header-left">
          <h1>
            <SettingsIcon size={24} color="#6366f1" />
            Settings
          </h1>
          <p>
            Manage your account profile, security posture, notification channels, and platform preferences.
          </p>
        </div>

        <div className="st-header-user">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="st-header-avatar" />
          ) : (
            <span className="st-header-avatar st-avatar-fallback">
              {user?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'BV'}
            </span>
          )}
          <div className="st-header-user-meta">
            <span className="st-header-user-name">{user?.name}</span>
            <span
              className="st-header-user-role"
              style={{ color: roleConfig?.badgeColor, background: roleConfig?.badgeBg }}
            >
              {roleConfig?.label || user?.role}
            </span>
          </div>
          <button
            type="button"
            className="st-icon-btn"
            onClick={loadSettings}
            disabled={isLoading}
            title="Reload settings"
            aria-label="Reload settings"
          >
            <RefreshCw size={15} className={isLoading ? 'st-spin' : ''} />
          </button>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="st-tabs" aria-label="Settings sections">
        {allowedTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`st-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {TAB_ICONS[tab.id]}
            <span className="st-tab-copy">
              <span className="st-tab-label">{tab.label}</span>
              <span className="st-tab-desc">{tab.description}</span>
            </span>
          </button>
        ))}
      </nav>

      {/* ── Tab Content ── */}
      <div className="st-content">
        {activeTab === 'profile' && (
          <ProfileSettingsTab
            user={user}
            settings={settings}
            isLoading={isLoading}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {activeTab === 'security' && <SecuritySettingsTab settings={settings} isLoading={isLoading} />}

        {activeTab === 'notifications' && (
          <NotificationSettingsTab settings={settings} isLoading={isLoading} />
        )}

        {activeTab === 'system' && <SystemConfigTab />}

        {activeTab === 'preferences' && (
          <PreferencesSettingsTab settings={settings} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}

