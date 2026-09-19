/**
 * Settings Module Type Definitions for BankVision
 */
import type { UserRole } from '@/shared/types/user'

// ─── User Settings ───────────────────────────────────────────────────────────

/**
 * SecurityController only implements the email channel; sms/authenticator
 * are rejected with 422 "Only the email channel is currently supported."
 */
export type TwoFactorChannel = 'email'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  transaction_alerts: boolean
  loan_alerts: boolean
  account_alerts: boolean
  weekly_digest: boolean
  alert_preferences: Record<AlertSeverity, boolean>
}

export type ThemePreference = 'dark' | 'light' | 'system'
type DashboardView = 'default' | 'compact' | 'detailed'

export interface UserPreferences {
  theme: ThemePreference
  dashboard_view: DashboardView
  timezone: string
  date_format: string
  items_per_page: number
}

export interface UserSettings {
  two_factor_enabled: boolean
  two_factor_channel: TwoFactorChannel | null
  notifications: NotificationSettings
  preferences: UserPreferences
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string
  email?: string
  phone?: string
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export interface AvatarUploadResponse {
  avatar: string
  avatar_url: string
}

// ─── Security ────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: number
  name: string
  is_current: boolean
  last_used_at: string | null
  created_at: string | null
}

type LoginEventType = 'login' | 'logout' | 'failed_login'

export interface LoginActivityEntry {
  id: number
  event: LoginEventType
  successful: boolean
  ip_address: string | null
  browser: string | null
  platform: string | null
  device: string | null
  logged_at: string | null
}

export interface LoginHistoryResponse {
  data: LoginActivityEntry[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiToken {
  id: number
  name: string
  abilities: string[]
  owner_name: string | null
  owner_role: UserRole | null
  last_used_at: string | null
  created_at: string | null
}

export interface CreateApiTokenResponse {
  id: number
  name: string
  token: string
}

/**
 * GET /settings/security/tokens responds with a non-standard envelope:
 * rows under `data` and pagination as a sibling `meta` key (no links).
 */
export interface ApiTokenListResponse {
  tokens: ApiToken[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// ─── System Configuration (admin) ────────────────────────────────────────────

interface BankSettings {
  name: string
  legal_name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  swift_code: string
  website: string
}

interface InterestRateSettings {
  savings_rate: number
  checking_rate: number
  fixed_deposit_rate: number
  personal_loan_rate: number
  business_loan_rate: number
  mortgage_rate: number
  overdraft_rate: number
  late_payment_penalty: number
}

export interface SystemSettings {
  bank: BankSettings
  interest: InterestRateSettings
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down'
    latency_ms: number
    connections: number
  }
  cache: {
    status: 'healthy' | 'degraded' | 'down'
    driver: string
  }
  storage: {
    status: 'healthy' | 'degraded' | 'down'
    disk_used_pct: number
    disk_free_bytes: number
  }
  application: {
    status: string
    environment: string
    php_version: string
    laravel: string
    timezone: string
  }
  activity: {
    total_users: number
    active_sessions: number
    failed_logins_24h: number
    open_alerts: number
    pending_transactions: number
    pending_loans: number
  }
  checked_at: string
}


