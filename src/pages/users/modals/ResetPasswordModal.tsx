import React, { useState } from 'react'
import { X, KeyRound, Eye, EyeOff } from 'lucide-react'
import { usersApi } from '@/api/users'
import { showToast } from '@/hooks/useToast'
import type { User } from '@/types/user'
import '../UserManagement.css'

interface Props {
  user: User
  onClose: () => void
}

export const ResetPasswordModal: React.FC<Props> = ({ user, onClose }) => {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await usersApi.resetPassword(user.id, password)
      showToast.success(`Password for ${user.name} has been reset successfully.`)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.'
      setError(msg)
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="um-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-modal um-modal-sm">
        <div className="um-modal-header">
          <h2>
            <KeyRound size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Reset Password
          </h2>
          <button className="um-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Set a new secure password for <strong>{user.name}</strong> ({user.email}).
            </p>

            {error && <div className="um-confirm-warning">{error}</div>}

            <div className="um-form-group" style={{ marginBottom: '1rem' }}>
              <label className="um-label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="um-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ paddingRight: '2.5rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '0.7rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                  }}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="um-form-group">
              <label className="um-label">Confirm New Password *</label>
              <input
                className="um-input"
                type={showPw ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <div className="um-modal-footer">
            <button type="button" className="um-btn um-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="um-btn um-btn-primary" disabled={loading}>
              <KeyRound size={15} />
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
