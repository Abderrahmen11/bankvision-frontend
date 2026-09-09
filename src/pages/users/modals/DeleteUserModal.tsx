import React, { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { usersApi } from '@/api/users'
import { showToast } from '@/hooks/useToast'
import type { User } from '@/types/user'
import '../UserManagement.css'

interface Props {
  user: User
  onClose: () => void
  onSuccess: () => void
}

export const DeleteUserModal: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed) return

    setLoading(true)
    try {
      await usersApi.delete(user.id)
      showToast.success(`User ${user.name} has been deleted.`)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user.'
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
            <AlertTriangle size={18} color="var(--rose-500)" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Delete User Account
          </h2>
          <button className="um-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleDelete}>
          <div className="um-modal-body">
            <div className="um-confirm-warning">
              <strong>Warning:</strong> You are about to permanently delete the account for{' '}
              <strong>{user.name}</strong> ({user.email}). This action is irreversible.
            </div>

            <div className="um-form-group">
              <label className="um-label">
                Please type <strong>DELETE</strong> to confirm:
              </label>
              <input
                className="um-input um-confirm-input"
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
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
              className="um-btn um-btn-danger"
              disabled={!isConfirmed || loading}
            >
              <Trash2 size={15} />
              {loading ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
