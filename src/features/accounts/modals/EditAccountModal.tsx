import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { Pencil } from 'lucide-react'
import { accountsApi } from '@/features/accounts/api/accounts'
import type { BankAccount } from '@/features/accounts/types'
import { AccountModalShell } from '../components/AccountModalShell'

interface Props {
  account: BankAccount
  onClose: () => void
  onSuccess: () => void
}

export const EditAccountModal: React.FC<Props> = ({ account, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [interestRate, setInterestRate] = useState(String(account.interest_rate ?? ''))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await accountsApi.update(account.id, {
        interest_rate: interestRate ? parseFloat(interestRate) : undefined,
      })
      showToast.success('Account updated successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update account.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AccountModalShell
      title={<><Pencil size={15} /> Edit Account</>}
      onClose={onClose}
      maxWidth={420}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" className="am-btn am-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="am-btn am-btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
            <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Editing account{' '}
                <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {account.account_number}
                </strong>
              </p>
            </div>

            <div className="am-form-group">
              <label className="am-form-label">Interest Rate (% p.a.)</label>
              <input
                className="am-form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 3.50"
              />
              <span className="am-form-hint">Current: {account.interest_rate}%</span>
            </div>
    </AccountModalShell>
  )
}
