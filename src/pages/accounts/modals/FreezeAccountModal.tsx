import React, { useState } from 'react'
import { X, Snowflake, CheckCircle } from 'lucide-react'
import { accountsApi } from '@/api/accounts'
import { showToast } from '@/hooks/useToast'
import type { BankAccount } from '@/types/account'

interface Props {
  account: BankAccount
  onClose: () => void
  onSuccess: () => void
}

export const FreezeAccountModal: React.FC<Props> = ({ account, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const isFrozen = account.status === 'frozen'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await accountsApi.update(account.id, {
        status: isFrozen ? 'active' : 'frozen',
      })
      showToast.success(isFrozen ? 'Account unfrozen successfully.' : 'Account frozen successfully.')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update account status.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="am-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal" style={{ maxWidth: 420 }}>
        <div className="am-modal-header">
          <h2>
            {isFrozen
              ? <><CheckCircle size={15} style={{ color: 'var(--emerald-500)' }} /> Unfreeze Account</>
              : <><Snowflake size={15} style={{ color: 'var(--amber-500)' }} /> Freeze Account</>
            }
          </h2>
          <button className="am-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="am-modal-body">
          {isFrozen ? (
            <div className="am-notice-box">
              <p>
                You are about to <strong>unfreeze</strong> account{' '}
                <strong style={{ fontFamily: 'monospace' }}>{account.account_number}</strong>.
                This will restore normal transaction capabilities for the account holder.
              </p>
            </div>
          ) : (
            <div className="am-notice-box">
              <p>
                You are about to <strong>freeze</strong> account{' '}
                <strong style={{ fontFamily: 'monospace' }}>{account.account_number}</strong>.
                All transaction processing will be suspended until the account is unfrozen.
              </p>
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong>Account holder:</strong>{' '}
            {account.customer?.full_name || `Customer #${account.customer_id}`}
          </div>
        </div>

        <div className="am-modal-footer">
          <button className="am-btn am-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`am-btn ${isFrozen ? 'am-btn-primary' : 'am-btn-ghost'}`}
            onClick={handleConfirm}
            disabled={loading}
            style={!isFrozen ? { color: 'var(--amber-500)', borderColor: 'rgba(245,158,11,0.3)' } : {}}
          >
            {loading
              ? (isFrozen ? 'Unfreezing…' : 'Freezing…')
              : (isFrozen ? 'Confirm Unfreeze' : 'Confirm Freeze')
            }
          </button>
        </div>
      </div>
    </div>
  )
}
