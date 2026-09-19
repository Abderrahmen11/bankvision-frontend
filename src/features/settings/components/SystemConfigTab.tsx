import { showToast } from '@/shared/hooks'
import React, { useEffect, useState } from 'react'
import {
  Landmark,
  Percent,
  ArrowRight,
  Activity,
  Building2,
  Users,
  FileSpreadsheet,
  Save,
  Database,
  HardDrive,
  Gauge,
  ServerCog,
  Users2,
  ShieldAlert,
  ArrowLeftRight,
  HandCoins,
  KeySquare,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { settingsApi } from '@/features/settings/api/settings'
import type { SystemHealth, SystemSettings } from '@/features/settings/types'
import { GlassCard, FormField, StatusPill, StButton, StSkeleton } from './SettingsUI'
import { formatBytes } from '../settingsHelpers'

const HEALTH_CARDS: Array<{
  key: 'database' | 'cache' | 'storage' | 'application'
  label: string
  icon: React.ReactNode
}> = [
  { key: 'database', label: 'Database', icon: <Database size={16} /> },
  { key: 'cache', label: 'Cache', icon: <Gauge size={16} /> },
  { key: 'storage', label: 'Storage', icon: <HardDrive size={16} /> },
  { key: 'application', label: 'Application', icon: <ServerCog size={16} /> },
]

const ACTIVITY_CARDS: Array<{
  key: keyof SystemHealth['activity']
  label: string
  icon: React.ReactNode
  accent: string
}> = [
  { key: 'total_users', label: 'Staff Users', icon: <Users2 size={16} />, accent: '#8b5cf6' },
  { key: 'active_sessions', label: 'Active Sessions', icon: <KeySquare size={16} />, accent: '#6366f1' },
  { key: 'failed_logins_24h', label: 'Failed Logins (24h)', icon: <ShieldAlert size={16} />, accent: '#ef4444' },
  { key: 'open_alerts', label: 'Open Alerts', icon: <ShieldAlert size={16} />, accent: '#f59e0b' },
  { key: 'pending_transactions', label: 'Pending Transactions', icon: <ArrowLeftRight size={16} />, accent: '#10b981' },
  { key: 'pending_loans', label: 'Pending Loans', icon: <HandCoins size={16} />, accent: '#06b6d4' },
]

const BRANCH_SHORTCUTS = [
  {
    to: '/branches',
    label: 'Branch Management',
    description: 'Create branches, assign managers & review performance',
    icon: <Building2 size={18} />,
  },
  {
    to: '/users',
    label: 'User Management',
    description: 'Onboard staff, assign roles and suspend accounts',
    icon: <Users size={18} />,
  },
  {
    to: '/audit-logs',
    label: 'Audit Logs',
    description: 'Review every privileged action across the platform',
    icon: <FileSpreadsheet size={18} />,
  },
]

export const SystemConfigTab: React.FC = () => {
  const [system, setSystem] = useState<SystemSettings | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([settingsApi.getSystemSettings(), settingsApi.getSystemHealth()])
      .then(([settingsData, healthData]) => {
        if (!active) return
        setSystem(settingsData)
        setHealth(healthData)
      })
      .catch((err) => {
        if (active) showToast.error(err instanceof Error ? err.message : 'Failed to load system configuration.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const refreshHealth = async () => {
    setIsRefreshingHealth(true)
    try {
      setHealth(await settingsApi.getSystemHealth())
      showToast.info('System health refreshed.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to refresh health.')
    } finally {
      setIsRefreshingHealth(false)
    }
  }

  const updateBank = (field: keyof SystemSettings['bank']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystem((prev) => (prev ? { ...prev, bank: { ...prev.bank, [field]: e.target.value } } : prev))
  }

  const updateInterest = (field: keyof SystemSettings['interest']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setSystem((prev) =>
      prev && !Number.isNaN(value)
        ? { ...prev, interest: { ...prev.interest, [field]: value } }
        : prev
    )
  }

  const handleSave = async () => {
    if (!system) return
    setIsSaving(true)
    try {
      const saved = await settingsApi.updateSystemSettings(system)
      setSystem(saved)
      showToast.success('System configuration saved.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to save system configuration.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !system) {
    return (
      <div className="st-tab-grid st-tab-grid-2">
        <StSkeleton height={280} className="st-span-2" />
        <StSkeleton height={200} />
        <StSkeleton height={200} />
        <StSkeleton height={260} className="st-span-2" />
      </div>
    )
  }

  return (
    <div className="st-tab-grid st-tab-grid-2">
      {/* ── Bank Details ── */}
      <GlassCard
        title="Bank Details"
        subtitle="Institution identity used on statements & correspondence"
        icon={<Landmark size={17} />}
        className="st-span-2"
      >
        <div className="st-form-row">
          <FormField label="Bank Name" htmlFor="bank-name">
            <input
              id="bank-name"
              className="st-input"
              value={system.bank.name}
              onChange={updateBank('name')}
            />
          </FormField>
          <FormField label="Legal Entity" htmlFor="bank-legal">
            <input
              id="bank-legal"
              className="st-input"
              value={system.bank.legal_name}
              onChange={updateBank('legal_name')}
            />
          </FormField>
        </div>

        <div className="st-form-row">
          <FormField label="Headquarters Address" htmlFor="bank-address">
            <input
              id="bank-address"
              className="st-input"
              value={system.bank.address}
              onChange={updateBank('address')}
            />
          </FormField>
          <FormField label="City" htmlFor="bank-city">
            <input id="bank-city" className="st-input" value={system.bank.city} onChange={updateBank('city')} />
          </FormField>
        </div>

        <div className="st-form-row">
          <FormField label="Country" htmlFor="bank-country">
            <input
              id="bank-country"
              className="st-input"
              value={system.bank.country}
              onChange={updateBank('country')}
            />
          </FormField>
          <FormField label="Contact Phone" htmlFor="bank-phone">
            <input id="bank-phone" className="st-input" value={system.bank.phone} onChange={updateBank('phone')} />
          </FormField>
        </div>

        <div className="st-form-row">
          <FormField label="Contact Email" htmlFor="bank-email">
            <input
              id="bank-email"
              type="email"
              className="st-input"
              value={system.bank.email}
              onChange={updateBank('email')}
            />
          </FormField>
          <FormField label="SWIFT / BIC" htmlFor="bank-swift" hint="8 or 11 characters">
            <input
              id="bank-swift"
              className="st-input st-mono"
              value={system.bank.swift_code}
              onChange={updateBank('swift_code')}
              maxLength={11}
            />
          </FormField>
        </div>

        <div className="st-form-row">
          <FormField label="Website" htmlFor="bank-website">
            <input
              id="bank-website"
              className="st-input"
              value={system.bank.website}
              onChange={updateBank('website')}
            />
          </FormField>
        </div>
      </GlassCard>

      {/* ── Interest Rate Configuration ── */}
      <GlassCard
        title="Interest Rate Configuration"
        subtitle="Annual percentage rates applied to new products"
        icon={<Percent size={17} />}
      >
        <div className="st-rate-grid">
          {(
            [
              ['savings_rate', 'Savings'],
              ['checking_rate', 'Checking'],
              ['fixed_deposit_rate', 'Fixed Deposit'],
              ['personal_loan_rate', 'Personal Loan'],
              ['business_loan_rate', 'Business Loan'],
              ['mortgage_rate', 'Mortgage'],
              ['overdraft_rate', 'Overdraft'],
              ['late_payment_penalty', 'Late Payment Penalty'],
            ] as Array<[keyof SystemSettings['interest'], string]>
          ).map(([key, label]) => (
            <FormField key={key} label={label} htmlFor={`rate-${key}`}>
              <div className="st-input-wrap st-rate-input">
                <input
                  id={`rate-${key}`}
                  type="number"
                  step="0.05"
                  min={0}
                  max={100}
                  className="st-input"
                  value={system.interest[key]}
                  onChange={updateInterest(key)}
                />
                <span className="st-rate-suffix">%</span>
              </div>
            </FormField>
          ))}
        </div>
      </GlassCard>

      {/* ── Save Bar ── */}
      <div className="st-save-banner st-span-2">
        <p>
          Configuration changes take effect immediately and are recorded in the audit trail.
        </p>
        <StButton icon={<Save size={15} />} loading={isSaving} onClick={handleSave}>
          Save System Configuration
        </StButton>
      </div>

      {/* ── System Health ── */}
      <GlassCard
        title="System Health"
        subtitle={health ? `Last checked ${health.checked_at.replace(' ', ' at ')}` : undefined}
        icon={<Activity size={17} />}
        className="st-span-2"
        action={
          <StButton variant="ghost" loading={isRefreshingHealth} onClick={refreshHealth}>
            Refresh
          </StButton>
        }
      >
        {health ? (
          <>
            <div className="st-health-grid">
              {HEALTH_CARDS.map(({ key, label, icon }) => (
                <div key={key} className="st-health-card">
                  <div className="st-health-head">
                    <span className="st-health-icon">{icon}</span>
                    <span className="st-health-label">{label}</span>
                  </div>
                  <StatusPill status={health[key].status} />
                  <div className="st-health-meta">
                    {key === 'database' && <span>{health.database.latency_ms} ms latency</span>}
                    {key === 'cache' && <span>{health.cache.driver} driver</span>}
                    {key === 'storage' && (
                      <span>
                        {health.storage.disk_used_pct}% used · {formatBytes(health.storage.disk_free_bytes)} free
                      </span>
                    )}
                    {key === 'application' && (
                      <span>
                        {health.application.environment} · PHP {health.application.php_version} · Laravel{' '}
                        {health.application.laravel}
                      </span>
                    )}
                  </div>
                  {key === 'storage' && (
                    <div className="st-progress">
                      <div
                        className={`st-progress-fill ${
                          health.storage.disk_used_pct > 85 ? 'danger' : health.storage.disk_used_pct > 65 ? 'warn' : ''
                        }`}
                        style={{ width: `${Math.min(health.storage.disk_used_pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="st-activity-grid">
              {ACTIVITY_CARDS.map(({ key, label, icon, accent }) => (
                <div key={key} className="st-activity-card">
                  <span className="st-activity-icon" style={{ color: accent }}>
                    {icon}
                  </span>
                  <span className="st-activity-value">{health.activity[key]}</span>
                  <span className="st-activity-label">{label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <StSkeleton height={140} />
        )}
      </GlassCard>

      {/* ── Branch Management Shortcuts ── */}
      <GlassCard
        title="Branch Management Shortcuts"
        subtitle="Jump into the operational areas you configure here"
        icon={<Building2 size={17} />}
        className="st-span-2"
      >
        <div className="st-shortcut-grid">
          {BRANCH_SHORTCUTS.map((shortcut) => (
            <Link key={shortcut.to} to={shortcut.to} className="st-shortcut-card">
              <span className="st-shortcut-icon">{shortcut.icon}</span>
              <span className="st-shortcut-copy">
                <span className="st-shortcut-label">{shortcut.label}</span>
                <span className="st-shortcut-desc">{shortcut.description}</span>
              </span>
              <ArrowRight size={16} className="st-shortcut-arrow" />
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
