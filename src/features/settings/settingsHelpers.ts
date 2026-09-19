/**
 * Settings module helpers — tab configuration and role-based access
 */
import type { UserRole } from '@/shared/types/user'

export type SettingsTabId = 'profile' | 'security' | 'notifications' | 'system' | 'preferences'

export interface SettingsTabConfig {
  id: SettingsTabId
  label: string
  description: string
  allowedRoles: UserRole[]
}

/**
 * Role-based tab access matrix:
 *  - Admin: full access to all settings (Security also covers sessions,
 *    login history & API tokens)
 *  - Every role: Profile, Security (2FA only for non-admin), Notifications
 *    and Preferences
 *  - System Configuration: admin only
 */
const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Personal information, password & avatar',
    allowedRoles: ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor'],
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Two-factor authentication',
    allowedRoles: ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email, push & alert severity preferences',
    allowedRoles: ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor'],
  },
  {
    id: 'system',
    label: 'System Configuration',
    description: 'Bank details, rates & health',
    allowedRoles: ['admin'],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Theme & appearance',
    allowedRoles: ['admin', 'manager', 'csr', 'compliance', 'analyst', 'auditor'],
  },
]

export function getAllowedTabs(role: UserRole): SettingsTabConfig[] {
  return SETTINGS_TABS.filter((tab) => tab.allowedRoles.includes(role))
}

export function canAccessTab(role: UserRole, tabId: SettingsTabId): boolean {
  return SETTINGS_TABS.some((tab) => tab.id === tabId && tab.allowedRoles.includes(role))
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export const ALERT_SEVERITY_META: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#ef4444' },
  high: { label: 'High', color: '#f59e0b' },
  medium: { label: 'Medium', color: '#3b82f6' },
  low: { label: 'Low', color: '#10b981' },
}

/** Human-friendly label for a Sanctum token / session name. */
export function formatSessionName(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'Unnamed Session'
}

/** Relative formatting like "2 hours ago" for session/login timestamps. */
export function formatRelative(timestamp: string | null): string {
  if (!timestamp) return 'Never'
  const then = new Date(timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z'))
  const diffMs = Date.now() - then.getTime()
  if (Number.isNaN(diffMs)) return timestamp

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function formatDateTime(timestamp: string | null): string {
  if (!timestamp) return '—'
  const then = new Date(timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z'))
  if (Number.isNaN(then.getTime())) return timestamp
  return then.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, idx)).toFixed(1)} ${units[idx]}`
}

