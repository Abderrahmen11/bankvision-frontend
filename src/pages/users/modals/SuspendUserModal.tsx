import React, { useState } from 'react'
import { X, AlertOctagon, CheckCircle2 } from 'lucide-react'
import { usersApi } from '@/api/users'
import { showToast } from '@/hooks/useToast'
import type { User } from '@/types/user'
import '../UserManagement.css'

interface Props {
  user: User
  targetStatus: 'active' | 'suspended'
  onClose: () => void
  onSuccess: () => void
}

export const SuspendUserModal: React.FC<Props> = ({
  user,
  targetStatus,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const isSuspending = targetStatus === 'suspended'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await usersApi.update(user.id, {
        status: targetStatus,
      })
      showToast.success(
        `Account for ${user.name} has been ${isSuspending ? 'suspended' : 'activated'}.`
      )
      onSuccess()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Failed to ${isSuspending ? 'suspend' : 'activate'} user.`
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
            {isSuspending ? (
              <AlertOctagon
                size={18}
                color="var(--rose-500)"
                style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
              />
            ) : (
              <CheckCircle2
                size={18}
                color="var(--emerald-500)"
                style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
              />
            )}
            {isSuspending ? 'Suspend User Account' : 'Reactivate User Account'}
          </h2>
          <button className="um-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="um-modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {isSuspending
                ? `Suspending this account will immediately revoke all access and active sessions for ${user.name} (${user.email}).`
                : `Reactivating this account will restore access for ${user.name} (${user.email}).`}
            </p>

            <div className="um-form-group">
              <label className="um-label">
                Reason {isSuspending ? '*' : '(Optional)'}
              </label>
              <textarea
                className="um-input"
                rows={3}
                placeholder={
                  isSuspending
                    ? 'E.g., Security policy violation, pending compliance review, extended leave...'
                    : 'E.g., Cleared compliance review, return to active duties...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={isSuspending}
                autoFocus
              />
            </div>
          </div>

          <div className="um-modal-footer">
            <button type="button" className="um-btn um-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`um-btn ${isSuspending ? 'um-btn-danger' : 'um-btn-success'}`}
              disabled={loading}
            >
              {isSuspending ? (
                <>
                  <AlertOctagon size={15} />
                  {loading ? 'Suspending…' : 'Suspend Account'}
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  {loading ? 'Activating…' : 'Activate Account'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
