import { showToast, useAuth, useTheme } from '@/shared/hooks'
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Landmark,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  ArrowLeft,
  KeyRound,
  Smartphone,
} from 'lucide-react'
import { TwoFactorRequiredError } from '../api/auth'
import { env } from '@/shared/config/env'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const { login, verifyTwoFactor, resendTwoFactor, isLoading, error, clearError } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as { prefillEmail?: string; prefillRole?: string } | null

  const [email, setEmail] = useState<string>(
    () => locationState?.prefillEmail || (env.isDemoMode ? 'admin@bankvision.com' : '')
  )
  const [password, setPassword] = useState(() => (env.isDemoMode ? 'password' : ''))
  const [localError, setLocalError] = useState<string | null>(null)

  // Two-factor challenge state (email OTP)
  const [challengeEmail, setChallengeEmail] = useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [devHint, setDevHint] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email.trim()) {
      setLocalError('Please enter your staff institutional email address.')
      return
    }

    if (!password) {
      setLocalError('Please enter your password.')
      return
    }

    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof TwoFactorRequiredError) {
        setChallengeEmail(email.trim())
        setTwoFactorCode('')
        setDevHint(err.devHint ?? null)
        showToast.info('Verification code sent to your email. It expires in 10 minutes.')
      }
      // Other errors handled in store/hook
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!challengeEmail) return
    if (twoFactorCode.trim().length !== 6) {
      setLocalError('Enter the 6-digit verification code from your email.')
      return
    }

    setIsVerifying(true)
    try {
      await verifyTwoFactor(challengeEmail, twoFactorCode.trim())
      navigate('/dashboard')
    } catch {
      // Error surfaced in the alert banner
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!challengeEmail || isResending) return
    setIsResending(true)
    try {
      const hint = await resendTwoFactor(challengeEmail)
      if (hint) setDevHint(hint)
      showToast.info('A new verification code has been sent.')
    } catch {
      showToast.error('Failed to resend the verification code.')
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToCredentials = () => {
    setChallengeEmail(null)
    setTwoFactorCode('')
    setLocalError(null)
    clearError()
  }

  const quickRoles = [
    { label: 'Admin', email: 'admin@bankvision.com', color: '#c9a86a' },
    { label: 'Manager', email: 'manager@bankvision.com', color: '#7b96d9' },
    { label: 'Compliance', email: 'compliance@bankvision.com', color: '#9a7bb8' },
    { label: 'CSR', email: 'csr@bankvision.com', color: '#dfa640' },
    { label: 'Analyst', email: 'analyst@bankvision.com', color: '#3cb878' },
    { label: 'Auditor', email: 'auditor@bankvision.com', color: '#98a2bc' },
  ]

  return (
    <div className="login-page-root">
      <div className="login-top-bar">
        <Link to="/" className="login-back-btn">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <button
          type="button"
          className="login-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div className="login-content-card glass-panel animate-fade-in">
        {challengeEmail ? (
          <>
            {/* ── Step 2: Two-Factor Verification (email OTP) ── */}
            <div className="login-header">
              <div className="login-brand-logo">
                <Smartphone size={28} />
              </div>
              <h2 className="login-title">Two-Factor Verification</h2>
              <p className="login-subtitle">
                We sent a 6-digit verification code to <strong>{challengeEmail}</strong>. It expires
                in 10 minutes.
              </p>
            </div>

            {(error || localError) && (
              <div className="login-error-alert animate-fade-in">
                <AlertCircle size={16} />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="login-form">
              <div className="form-group">
                <label htmlFor="twofa-code" className="form-label">
                  Verification Code
                </label>
                <div className="input-wrapper">
                  <KeyRound size={17} className="input-icon" />
                  <input
                    id="twofa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="form-input"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                    style={{ letterSpacing: '0.35em', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>

              {devHint && (
                <div className="login-dev-hint animate-fade-in">
                  <KeyRound size={14} />
                  <span>{devHint}</span>
                </div>
              )}

              <div className="login-2fa-resend">
                <button
                  type="button"
                  className="login-resend-btn"
                  onClick={handleResendCode}
                  disabled={isResending || isLoading}
                >
                  {isResending ? 'Resending…' : 'Resend code'}
                </button>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isVerifying || isLoading}
              >
                {isVerifying || isLoading ? (
                  <div className="btn-spinner" />
                ) : (
                  <>
                    <ShieldCheck size={17} />
                    <span>Verify & Enter Terminal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="login-back-to-credentials"
                onClick={handleBackToCredentials}
              >
                <ArrowLeft size={14} />
                Use a different account
              </button>
            </form>

            <div className="login-footer-security">
              <ShieldCheck size={15} />
              <span>Two-factor protected session</span>
            </div>
          </>
        ) : (
          <>
            {/* ── Step 1: Credentials ── */}
            <div className="login-header">
              <div className="login-brand-logo">
                <Landmark size={28} />
              </div>
              <h2 className="login-title">Staff Portal Authentication</h2>
              <p className="login-subtitle">
                Secure institutional access to Central Ledger & Operations.
              </p>
            </div>

            {/* Quick Demo Switcher — only in demo mode */}
            {env.isDemoMode && (
              <div className="quick-roles-container">
                <span className="quick-roles-title">QUICK DEMO PREFILLS:</span>
                <div className="quick-roles-pills">
                  {quickRoles.map((r) => (
                    <button
                      key={r.label}
                      type="button"
                      className={`role-pill ${email === r.email ? 'active' : ''}`}
                      style={{
                        borderColor: email === r.email ? r.color : undefined,
                        color: email === r.email ? r.color : undefined,
                      }}
                      onClick={() => {
                        setEmail(r.email)
                        setPassword('password')
                        setLocalError(null)
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(error || localError) && (
              <div className="login-error-alert animate-fade-in">
                <AlertCircle size={16} />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Staff Institutional Email
                </label>
                <div className="input-wrapper">
                  <Mail size={17} className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="staff@bankvision.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password" className="form-label">
                    Master Password
                  </label>
                  {env.isDemoMode && <span className="demo-pass-hint">(Demo: password)</span>}
                </div>
                <div className="input-wrapper">
                  <Lock size={17} className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="btn-spinner" />
                ) : (
                  <>
                    <KeyRound size={17} />
                    <span>Authorize & Enter Terminal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer-security">
              <ShieldCheck size={15} />
              <span>Encrypted session. Your credentials never leave this terminal.</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
