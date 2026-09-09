import React, { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { accountsApi } from '@/api/accounts'
import { showToast } from '@/hooks/useToast'
import type { BankAccount } from '@/types/account'

interface Props {
  account: BankAccount
  onClose: () => void
  onSuccess: () => void
}

const CONFIRM_PHRASE = 'CLOSE'

export const CloseAccountModal: React.FC<Props> = ({ account, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading]         = useState(false)

  const isConfirmed = confirmText === CONFIRM_PHRASE

  const handleClose = async () => {
    if (!isConfirmed) return
    setLoading(true)
    try {
      await accountsApi.close(account.id)
      showToast.success('Account closed successfully.')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to close account.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="am-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal" style={{ maxWidth: 440 }}>
        <div className="am-modal-header">
          <h2 style={{ color: 'var(--rose-500)' }}>
            <Trash2 size={15} /> Close Account
          </h2>
          <button className="am-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="am-modal-body">
          <div className="am-danger-box">
            <p>
              <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              <strong>This action is irreversible.</strong> Closing account{' '}
              <strong style={{ fontFamily: 'monospace' }}>{account.account_number}</strong>{' '}
              will permanently prevent all future transactions.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              The account belongs to:{' '}
              <strong>{account.customer?.full_name || `Customer #${account.customer_id}`}</strong>
            </p>
            {account.balance > 0 && (
              <p style={{ marginTop: '0.5rem', color: 'var(--rose-500)' }}>
                ⚠ This account still has a balance of{' '}
                <strong>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
                </strong>.
                Ensure funds are transferred before closing.
              </p>
            )}
          </div>

          <div className="am-form-group">
            <label className="am-form-label">
              Type <strong style={{ color: 'var(--rose-500)' }}>{CONFIRM_PHRASE}</strong> to confirm
            </label>
            <input
              className="am-form-input"
              type="text"
              placeholder={CONFIRM_PHRASE}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={isConfirmed ? { borderColor: 'var(--rose-500)' } : {}}
              autoFocus
            />
          </div>
        </div>

        <div className="am-modal-footer">
          <button className="am-btn am-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="am-btn am-btn-danger"
            onClick={handleClose}
            disabled={!isConfirmed || loading}
          >
            {loading ? 'Closing…' : 'Permanently Close Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
