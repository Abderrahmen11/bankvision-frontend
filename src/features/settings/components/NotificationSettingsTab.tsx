import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { Bell, Mail, BellRing, AlertOctagon, Send, PiggyBank, CreditCard, Landmark, Newspaper, Save } from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settings'
import type { AlertSeverity, NotificationSettings, UserSettings } from '@/features/settings/types'
import { GlassCard, ToggleSwitch, StButton, StSkeleton } from './SettingsUI'
import { ALERT_SEVERITY_META } from '../settingsHelpers'

interface NotificationSettingsTabProps {
  settings: UserSettings | null
  isLoading: boolean
}

const DELIVERY_TOGGLES: Array<{
  key: keyof NotificationSettings
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}> = [
  {
    key: 'email_notifications',
    label: 'Email Notifications',
    description: 'Statements, confirmations and account summaries delivered by email.',
    icon: <Mail size={16} />,
    accent: '#6366f1',
  },
  {
    key: 'push_notifications',
    label: 'Push Notifications',
    description: 'Real-time alerts in the browser for time-critical events.',
    icon: <BellRing size={16} />,
    accent: '#f59e0b',
  },
]

const DOMAIN_TOGGLES: Array<{
  key: keyof NotificationSettings
  label: string
  description: string
  icon: React.ReactNode
  accent: string
}> = [
  {
    key: 'transaction_alerts',
    label: 'Transaction Alerts',
    description: 'Large or unusual movements across managed accounts.',
    icon: <CreditCard size={16} />,
    accent: '#10b981',
  },
  {
    key: 'loan_alerts',
    label: 'Loan Alerts',
    description: 'Applications awaiting approval, missed payments and maturities.',
    icon: <Landmark size={16} />,
    accent: '#3b82f6',
  },
  {
    key: 'account_alerts',
    label: 'Account Alerts',
    description: 'New account openings, freezes and closure requests.',
    icon: <PiggyBank size={16} />,
    accent: '#a855f7',
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'A consolidated Monday-morning summary of branch activity.',
    icon: <Newspaper size={16} />,
    accent: '#06b6d4',
  },
]

export const NotificationSettingsTab: React.FC<NotificationSettingsTabProps> = ({ settings, isLoading }) => {
  const [notifications, setNotifications] = useState<NotificationSettings | null>(
    settings?.notifications ?? null
  )
  const [syncedFrom, setSyncedFrom] = useState<UserSettings | null>(settings)
  const [isSaving, setIsSaving] = useState(false)

  // Sync from the loaded settings during render (avoids setState-in-effect)
  if (settings && settings !== syncedFrom && !isSaving) {
    setSyncedFrom(settings)
    setNotifications(settings.notifications)
  }

  if (isLoading || !notifications) {
    return (
      <div className="st-tab-grid st-tab-grid-2">
        <StSkeleton height={220} />
        <StSkeleton height={220} />
        <StSkeleton height={300} className="st-span-2" />
      </div>
    )
  }

  const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setNotifications((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = async () => {
    if (!notifications) return
    setIsSaving(true)
    try {
      const saved = await settingsApi.updateNotifications(notifications)
      setNotifications(saved)
      showToast.success('Notification settings saved.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to save notification settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="st-tab-grid st-tab-grid-2">
      {/* ── Delivery Channels ── */}
      <GlassCard
        title="Delivery Channels"
        subtitle="Choose how BankVision reaches you"
        icon={<Bell size={17} />}
      >
        <div className="st-toggle-stack">
          {DELIVERY_TOGGLES.map((toggle) => (
            <div key={String(toggle.key)} className="st-toggle-icon-row">
              <span className="st-toggle-icon" style={{ color: toggle.accent, background: 'rgba(99,102,241,0.08)' }}>
                {toggle.icon}
              </span>
              <ToggleSwitch
                checked={Boolean(notifications[toggle.key])}
                onChange={(next) => update(toggle.key, next as never)}
                label={toggle.label}
                description={toggle.description}
                accent={toggle.accent}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Operational Domains ── */}
      <GlassCard
        title="Operational Alerts"
        subtitle="Pick the domains worth interrupting you for"
        icon={<Send size={17} />}
      >
        <div className="st-toggle-stack">
          {DOMAIN_TOGGLES.map((toggle) => (
            <div key={String(toggle.key)} className="st-toggle-icon-row">
              <span className="st-toggle-icon" style={{ color: toggle.accent, background: 'rgba(99,102,241,0.08)' }}>
                {toggle.icon}
              </span>
              <ToggleSwitch
                checked={Boolean(notifications[toggle.key])}
                onChange={(next) => update(toggle.key, next as never)}
                label={toggle.label}
                description={toggle.description}
                accent={toggle.accent}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Alert Severity Preferences ── */}
      <GlassCard
        title="Alert Severity Preferences"
        subtitle="Choose which compliance & risk alert severities raise notifications"
        icon={<AlertOctagon size={17} />}
        className="st-span-2"
      >
        <div className="st-severity-grid">
          {(Object.keys(ALERT_SEVERITY_META) as AlertSeverity[]).map((severity) => {
            const meta = ALERT_SEVERITY_META[severity]
            const checked = notifications.alert_preferences?.[severity] ?? false
            return (
              <div key={severity} className="st-severity-card">
                <div className="st-severity-head">
                  <span
                    className="st-severity-dot"
                    style={{ background: meta.color, boxShadow: `0 0 14px ${meta.color}55` }}
                  />
                  <span className="st-severity-label" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <ToggleSwitch
                  checked={checked}
                  onChange={(next) =>
                    setNotifications((prev) =>
                      prev
                        ? {
                            ...prev,
                            alert_preferences: { ...prev.alert_preferences, [severity]: next },
                          }
                        : prev
                    )
                  }
                  label={`${meta.label} severity alerts`}
                  description={
                    severity === 'critical'
                      ? 'Immediate escalation - recommended to keep enabled.'
                      : severity === 'high'
                        ? 'Investigation-worthy events flagged by AML rules.'
                        : severity === 'medium'
                          ? 'Routine compliance reviews and watchlist hits.'
                          : 'Low-priority monitoring noise.'
                  }
                  accent={meta.color}
                />
              </div>
            )
          })}
        </div>

        <div className="st-form-footer st-save-bar">
          <p className="st-save-note">Changes apply immediately after saving.</p>
          <StButton icon={<Save size={15} />} loading={isSaving} onClick={handleSave}>
            Save Notification Settings
          </StButton>
        </div>
      </GlassCard>
    </div>
  )
}
