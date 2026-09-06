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
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as { prefillEmail?: string; prefillRole?: string } | null

  const [email, setEmail] = useState<string>(
    () => locationState?.prefillEmail || 'admin@bankvision.com'
  )
  const [password, setPassword] = useState('password')
  const [localError, setLocalError] = useState<string | null>(null)


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
    } catch {
      // Error handled in store/hook
    }
  }

  const quickRoles = [
    { label: 'Admin', email: 'admin@bankvision.com', color: '#8b5cf6' },
    { label: 'Manager', email: 'manager@bankvision.com', color: '#3b82f6' },
    { label: 'Compliance', email: 'compliance@bankvision.com', color: '#ec4899' },
    { label: 'CSR', email: 'csr@bankvision.com', color: '#f59e0b' },
    { label: 'Analyst', email: 'analyst@bankvision.com', color: '#10b981' },
    { label: 'Auditor', email: 'auditor@bankvision.com', color: '#06b6d4' },
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
        <div className="login-header">
          <div className="login-brand-logo">
            <Landmark size={28} />
          </div>
          <h2 className="login-title">Staff Portal Authentication</h2>
          <p className="login-subtitle">
            Secure institutional access to Central Ledger & Operations.
          </p>
        </div>

        {/* Quick Demo Switcher */}
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
              <span className="demo-pass-hint">(Demo: password)</span>
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
          <span>256-bit TLS Encrypted Session • Protocol 2.4</span>
        </div>
      </div>
    </div>
  )
}
