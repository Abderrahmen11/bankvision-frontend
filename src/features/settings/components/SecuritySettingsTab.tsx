import { showToast, useAuth } from '@/shared/hooks'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  MonitorSmartphone,
  LogIn,
  LogOut,
  AlertTriangle,
  KeyRound,
  Plus,
  Trash2,
  History,
  Copy,
  Fingerprint,
} from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settings'
import type {
  ActiveSession,
  ApiToken,
  ApiTokenListResponse,
  CreateApiTokenResponse,
  LoginActivityEntry,
  TwoFactorChannel,
  UserSettings,
} from '@/features/settings/types'
import { GlassCard, ToggleSwitch, StButton, StEmpty } from './SettingsUI'
import {
  formatDateTime,
  formatRelative,
  formatSessionName,
} from '../settingsHelpers'

// Backend only supports the email channel for 2FA (others 422)
const TWO_FACTOR_CHANNELS: Array<{ value: TwoFactorChannel; label: string; hint: string }> = [
  { value: 'email', label: 'Email', hint: 'One-time codes sent to your inbox' },
]

interface SecuritySettingsTabProps {
  settings: UserSettings | null
  isLoading: boolean
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ settings, isLoading }) => {
  const { isAdmin } = useAuth()
  // ── Two-factor ─────────────────────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorChannel, setTwoFactorChannel] = useState<TwoFactorChannel>('email')
  const [twoFactorSynced, setTwoFactorSynced] = useState<UserSettings | null>(null)
  const [isToggling2FA, setIsToggling2FA] = useState(false)

  // Real email-OTP enable flow: request code -> confirm -> enabled
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  // Sync from the loaded settings during render (avoids setState-in-effect)
  if (settings && settings !== twoFactorSynced) {
    setTwoFactorSynced(settings)
    setTwoFactorEnabled(settings.two_factor_enabled)
    setTwoFactorChannel(settings.two_factor_channel ?? 'email')
  }

  const handleToggle2FA = async (next: boolean) => {
    setIsToggling2FA(true)
    try {
      if (next) {
        // Canonical enable contract: POST /settings/security/2fa {enabled:true}
        // responds 422 + requires_verification once the email code is sent;
        // the code is then confirmed via /settings/security/2fa/verify.
        try {
          await settingsApi.setTwoFactor(true, 'email')
        } catch (err) {
          const raw = (err as { raw?: { requires_verification?: boolean; message?: string } }).raw
          if (!raw?.requires_verification) throw err
          setShowCodeInput(true)
          setTwoFactorCode('')
          showToast.info(raw.message ?? 'Verification code sent to your email. It expires in 10 minutes.')
          return
        }
        // Defensive: backend enabled without a verification step
        setTwoFactorEnabled(true)
        setShowCodeInput(false)
      } else {
        const result = await settingsApi.setTwoFactor(false)
        setTwoFactorEnabled(result.two_factor_enabled)
        setShowCodeInput(false)
        showToast.success('Two-factor authentication disabled.')
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to update two-factor settings.')
    } finally {
      setIsToggling2FA(false)
    }
  }

  const handleConfirm2FACode = async () => {
    if (twoFactorCode.trim().length !== 6) {
      showToast.error('Enter the 6-digit code from your email.')
      return
    }
    setIsVerifyingCode(true)
    try {
      const result = await settingsApi.verifyTwoFactorCode(twoFactorCode.trim())
      setTwoFactorEnabled(result.two_factor_enabled)
      setShowCodeInput(false)
      setTwoFactorCode('')
      showToast.success('Two-factor authentication enabled. You will be asked for a code at every sign-in.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Invalid or expired verification code.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleResendCode = async () => {
    setIsToggling2FA(true)
    try {
      await settingsApi.sendTwoFactorCode(twoFactorChannel)
      showToast.info('A new verification code has been sent to your email.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setIsToggling2FA(false)
    }
  }

  const handleChannelChange = async (channel: TwoFactorChannel) => {
    // Email is the only channel the backend implements; nothing to switch.
    setTwoFactorChannel(channel)
  }

  // ── Sessions ───────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  useEffect(() => {
    // Sessions are a personal-security feature — the backend serves them
    // to every authenticated role.
    let active = true
    settingsApi
      .getSessions()
      .then((data) => {
        if (active) setSessions(data)
      })
      .catch((err) => {
        if (active) showToast.error(err instanceof Error ? err.message : 'Failed to load sessions.')
      })
      .finally(() => {
        if (active) setIsLoadingSessions(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleRevokeSession = async (id: number) => {
    setRevokingId(id)
    try {
      await settingsApi.revokeSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      showToast.success('Session revoked.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to revoke session.')
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async () => {
    setIsRevokingAll(true)
    try {
      const count = await settingsApi.revokeAllSessions()
      setSessions((prev) => prev.filter((s) => s.is_current))
      showToast.success(count > 0 ? `Revoked ${count} other session(s).` : 'No other sessions to revoke.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to revoke sessions.')
    } finally {
      setIsRevokingAll(false)
    }
  }

  // ── Login history ──────────────────────────────────────────────────────────
  const [history, setHistory] = useState<LoginActivityEntry[]>([])
  const [historyMeta, setHistoryMeta] = useState({ page: 1, lastPage: 1, total: 0 })
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const fetchHistory = useCallback(async (page: number) => {
    return settingsApi.getLoginHistory(page)
  }, [])

  useEffect(() => {
    // Login history is a personal-security feature — every role gets it.
    let active = true
    fetchHistory(1)
      .then((res) => {
        if (!active) return
        setHistory(res.data)
        setHistoryMeta({ page: res.current_page, lastPage: res.last_page, total: res.total })
      })
      .catch((err) => {
        if (active) showToast.error(err instanceof Error ? err.message : 'Failed to load login history.')
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false)
      })
    return () => {
      active = false
    }
  }, [fetchHistory])

  const handleLoadOlderHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await fetchHistory(historyMeta.page + 1)
      setHistory((prev) => [...prev, ...res.data])
      setHistoryMeta({ page: res.current_page, lastPage: res.last_page, total: res.total })
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to load login history.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // ── API tokens (admin) ─────────────────────────────────────────────────────
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [tokenMeta, setTokenMeta] = useState<ApiTokenListResponse['meta'] | null>(null)
  const [isLoadingTokens, setIsLoadingTokens] = useState(true)
  const [newTokenName, setNewTokenName] = useState('')
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [createdToken, setCreatedToken] = useState<CreateApiTokenResponse | null>(null)
  const [revokingTokenId, setRevokingTokenId] = useState<number | null>(null)

  const loadTokens = useCallback(async () => {
    try {
      const res = await settingsApi.getTokens()
      setTokens(res.tokens)
      setTokenMeta(res.meta)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to load API tokens.')
    } finally {
      setIsLoadingTokens(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    settingsApi
      .getTokens()
      .then((res) => {
        if (active) {
          setTokens(res.tokens)
          setTokenMeta(res.meta)
        }
      })
      .catch((err) => {
        if (active) showToast.error(err instanceof Error ? err.message : 'Failed to load API tokens.')
      })
      .finally(() => {
        if (active) setIsLoadingTokens(false)
      })
    return () => {
      active = false
    }
  }, [isAdmin])

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTokenName.trim()) {
      showToast.error('Please give the token a descriptive name.')
      return
    }
    setIsCreatingToken(true)
    try {
      const created = await settingsApi.createToken(newTokenName.trim())
      setCreatedToken(created)
      setNewTokenName('')
      showToast.success('API token created - copy it now, it will not be shown again.')
      loadTokens()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to create token.')
    } finally {
      setIsCreatingToken(false)
    }
  }

  const handleRevokeToken = async (id: number) => {
    setRevokingTokenId(id)
    try {
      await settingsApi.revokeToken(id)
      setTokens((prev) => prev.filter((t) => t.id !== id))
      showToast.success('API token revoked.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to revoke token.')
    } finally {
      setRevokingTokenId(null)
    }
  }

  const handleCopyToken = async () => {
    if (!createdToken) return
    try {
      await navigator.clipboard.writeText(createdToken.token)
      showToast.success('Token copied to clipboard.')
    } catch {
      showToast.error('Could not copy - please copy it manually.')
    }
  }

  if (isLoading) {
    return (
      <div className="st-tab-grid">
        <div className="st-skeleton st-skeleton-card" />
        <div className="st-skeleton st-skeleton-card" />
      </div>
    )
  }

  return (
    <div className="st-tab-grid">
      {/* ── Two-Factor Authentication ── */}
      <GlassCard
        title="Two-Factor Authentication"
        subtitle="Add a second verification step when signing in"
        icon={twoFactorEnabled ? <ShieldCheck size={17} /> : <ShieldOff size={17} />}
        action={
          <span className={`st-2fa-badge ${twoFactorEnabled ? 'on' : 'off'}`}>
            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        }
        className="st-span-2"
      >
        <ToggleSwitch
          checked={twoFactorEnabled}
          onChange={handleToggle2FA}
          disabled={isToggling2FA}
          label="Require two-factor authentication"
          description="You will be asked for a verification code at every sign-in."
          accent="#10b981"
        />

        {showCodeInput && (
          <div
            className="st-token-reveal"
            role="alert"
            style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            <div className="st-token-reveal-head">
              <strong>Confirm verification code</strong>
              <button
                type="button"
                className="st-inline-link"
                onClick={() => setShowCodeInput(false)}
              >
                Cancel
              </button>
            </div>
            <div className="st-token-value">
              <input
                className="st-input st-mono"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ letterSpacing: '0.35em', textAlign: 'center', maxWidth: 160, fontWeight: 700 }}
                aria-label="6-digit verification code"
              />
              <StButton
                icon={<ShieldCheck size={14} />}
                loading={isVerifyingCode}
                onClick={handleConfirm2FACode}
              >
                Verify & Enable
              </StButton>
              <StButton variant="ghost" loading={isToggling2FA} onClick={handleResendCode}>
                Resend code
              </StButton>
            </div>
            <p className="st-token-warning">
              Check your email inbox for the 6-digit code - it expires in 10 minutes.
            </p>
          </div>
        )}

        <div className="st-2fa-channels" role="radiogroup" aria-label="2FA delivery channel">
          {TWO_FACTOR_CHANNELS.map((channel) => (
            <button
              key={channel.value}
              type="button"
              role="radio"
              aria-checked={twoFactorChannel === channel.value}
              className={`st-channel-card ${twoFactorChannel === channel.value ? 'selected' : ''}`}
              onClick={() => handleChannelChange(channel.value)}
            >
              <span className="st-channel-label">{channel.label}</span>
              <span className="st-channel-hint">{channel.hint}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Active Sessions ── */}
      <GlassCard
        title="Active Sessions"
        subtitle="Devices currently signed in to your account"
        icon={<MonitorSmartphone size={17} />}
        className="st-span-2"
        action={
          sessions.filter((s) => !s.is_current).length > 0 && (
            <StButton variant="ghost" icon={<LogOut size={14} />} loading={isRevokingAll} onClick={handleRevokeAll}>
              Revoke All Others
            </StButton>
          )
        }
      >
        {isLoadingSessions ? (
          <div className="st-list-stack">
            <div className="st-skeleton st-skeleton-row" />
            <div className="st-skeleton st-skeleton-row" />
          </div>
        ) : sessions.length === 0 ? (
          <StEmpty icon={<MonitorSmartphone size={22} />} message="No active sessions found." />
        ) : (
          <ul className="st-list">
            {sessions.map((session) => (
              <li key={session.id} className="st-list-item">
                <span className="st-list-icon">
                  <Fingerprint size={16} />
                </span>
                <div className="st-list-main">
                  <span className="st-list-title">
                    {formatSessionName(session.name)}
                    {session.is_current && <em className="st-badge st-badge-current">This device</em>}
                  </span>
                  <span className="st-list-sub">
                    Last active {formatRelative(session.last_used_at)} · signed in {formatDateTime(session.created_at)}
                  </span>
                </div>
                {!session.is_current && (
                  <StButton
                    variant="danger"
                    loading={revokingId === session.id}
                    onClick={() => handleRevokeSession(session.id)}
                    title="Revoke this session"
                  >
                    Revoke
                  </StButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* ── Login History ── */}
      <GlassCard
        title="Login History"
        subtitle={`Authentication activity · ${historyMeta.total} recorded event(s)`}
        icon={<History size={17} />}
        className="st-span-2"
      >
        {isLoadingHistory && history.length === 0 ? (
          <div className="st-list-stack">
            <div className="st-skeleton st-skeleton-row" />
            <div className="st-skeleton st-skeleton-row" />
            <div className="st-skeleton st-skeleton-row" />
          </div>
        ) : history.length === 0 ? (
          <StEmpty icon={<History size={22} />} message="No login activity recorded yet." />
        ) : (
          <>
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <span className={`st-event st-event-${entry.event}`}>
                          {entry.event === 'failed_login' ? (
                            <AlertTriangle size={13} />
                          ) : entry.event === 'logout' ? (
                            <LogOut size={13} />
                          ) : (
                            <LogIn size={13} />
                          )}
                          {entry.event === 'failed_login' ? 'Failed sign-in' : entry.event === 'logout' ? 'Sign-out' : 'Sign-in'}
                        </span>
                      </td>
                      <td>
                        <span className="st-device-cell">
                          {entry.browser ?? 'Unknown'} · {entry.platform ?? 'Unknown'}
                          <em>{entry.device ?? ''}</em>
                        </span>
                      </td>
                      <td className="st-mono">{entry.ip_address ?? '-'}</td>
                      <td title={formatDateTime(entry.logged_at)}>{formatRelative(entry.logged_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {historyMeta.page < historyMeta.lastPage && (
              <div className="st-load-more">
                <StButton
                  variant="ghost"
                  loading={isLoadingHistory}
                  onClick={handleLoadOlderHistory}
                >
                  Load Older Activity
                </StButton>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {isAdmin && (
      <>      {/* ── API Tokens (admin) ── */}
      <GlassCard
        title="API Tokens"
        subtitle="Personal access tokens for external integrations"
        icon={<KeyRound size={17} />}
        className="st-span-2"
        action={
          <span className="st-badge st-badge-info">Admin Only</span>
        }
      >
        <form onSubmit={handleCreateToken} className="st-token-form">
          <div className="st-input-wrap st-token-input">
            <KeyRound size={15} className="st-input-icon" />
            <input
              className="st-input"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="e.g. Reporting Integration, Core Banking Bridge"
              maxLength={100}
            />
          </div>
          <StButton type="submit" icon={<Plus size={15} />} loading={isCreatingToken}>
            Create Token
          </StButton>
        </form>

        {createdToken && (
          <div className="st-token-reveal" role="alert">
            <div className="st-token-reveal-head">
              <strong>{createdToken.name}</strong>
              <button type="button" className="st-inline-link" onClick={() => setCreatedToken(null)}>
                Dismiss
              </button>
            </div>
            <div className="st-token-value">
              <code className="st-mono">{createdToken.token}</code>
              <StButton variant="ghost" icon={<Copy size={14} />} onClick={handleCopyToken}>
                Copy
              </StButton>
            </div>
            <p className="st-token-warning">
              Store this token securely - it will never be displayed again.
            </p>
          </div>
        )}

        {isLoadingTokens ? (
          <div className="st-list-stack">
            <div className="st-skeleton st-skeleton-row" />
          </div>
        ) : tokens.length === 0 ? (
          <StEmpty icon={<KeyRound size={22} />} message="No API tokens issued yet." />
        ) : (
          <ul className="st-list">
            {tokens.map((token) => (
              <li key={token.id} className="st-list-item">
                <span className="st-list-icon">
                  <KeyRound size={16} />
                </span>
                <div className="st-list-main">
                  <span className="st-list-title">
                    {token.name}
                    {token.owner_name && <em className="st-badge st-badge-owner">{token.owner_name}</em>}
                  </span>
                  <span className="st-list-sub">
                    Last used {formatRelative(token.last_used_at)} · created {formatDateTime(token.created_at)}
                  </span>
                </div>
                <StButton
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  loading={revokingTokenId === token.id}
                  onClick={() => handleRevokeToken(token.id)}
                >
                  Revoke
                </StButton>
              </li>
            ))}
          </ul>
        )}
        {tokenMeta && tokenMeta.total > tokens.length && (
          <p className="st-token-warning" style={{ marginTop: 8 }}>
            Showing first {tokens.length} of {tokenMeta.total} registered tokens.
          </p>
        )}
      </GlassCard>

      </>
      )}

      <div className="st-hint st-span-2">
        <Shield size={16} />
        <p>
          Sessions and two-factor settings apply to your personal account only. Review sign-ins you do not
          recognise and revoke them immediately.
        </p>
      </div>

    </div>
  )
}
