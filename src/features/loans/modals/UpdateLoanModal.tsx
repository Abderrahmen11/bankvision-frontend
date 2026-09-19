import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { X, Edit3, AlertCircle } from 'lucide-react'
import { loansApi } from '@/features/loans/api/loans'
import type { Loan, LoanStatus, UpdateLoanPayload } from '@/features/loans/types'
import { formatCurrency } from '../loanHelpers'

interface Props {
  loan: Loan
  onClose: () => void
  onSuccess: () => void
}

export const UpdateLoanModal: React.FC<Props> = ({ loan, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const [outstandingBalance, setOutstandingBalance] = useState(
    loan.outstanding_balance?.toString() || '0'
  )
  const [nextPaymentDate, setNextPaymentDate] = useState(
    loan.next_payment_date || ''
  )
  const [status, setStatus] = useState<LoanStatus>(loan.status)

  // Allowed transitions map
  const transitionMap: Record<LoanStatus, LoanStatus[]> = {
    pending: ['pending', 'active', 'completed'],
    active: ['active', 'delinquent', 'completed'],
    delinquent: ['delinquent', 'defaulted', 'completed'],
    defaulted: ['defaulted', 'completed'],
    completed: ['completed'],
  }
  const allowedStatuses = transitionMap[loan.status] || [loan.status]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numBal = parseFloat(outstandingBalance)
    if (isNaN(numBal) || numBal < 0) {
      showToast.error('Outstanding balance cannot be negative.')
      return
    }

    const payload: UpdateLoanPayload = {
      outstanding_balance: numBal,
      next_payment_date: nextPaymentDate || undefined,
      status: status !== loan.status ? status : undefined,
    }

    setLoading(true)
    try {
      await loansApi.update(loan.id, payload)
      showToast.success('Loan updated successfully!')
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update loan.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ln-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ln-modal">
        <div className="ln-modal-header">
          <h2>
            <Edit3 size={17} /> Update Loan #{loan.loan_number}
          </h2>
          <button className="ln-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ln-modal-body">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Applicant: <strong>{loan.customer?.full_name}</strong> • Principal:{' '}
              <strong>{formatCurrency(loan.principal_amount)}</strong>
            </div>

            {/* Outstanding Balance */}
            <div className="ln-form-group">
              <label className="ln-form-label">Outstanding Balance ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="ln-form-input"
                value={outstandingBalance}
                onChange={(e) => setOutstandingBalance(e.target.value)}
                required
              />
              <span className="ln-form-hint">
                Original Principal: {formatCurrency(loan.principal_amount)}. Setting to $0 will automatically mark loan as completed.
              </span>
            </div>

            {/* Next Payment Date */}
            <div className="ln-form-group">
              <label className="ln-form-label">Next Payment Due Date</label>
              <input
                type="date"
                className="ln-form-input"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
              />
            </div>

            {/* Status Transition */}
            <div className="ln-form-group">
              <label className="ln-form-label">Loan Status</label>
              <select
                className="ln-form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as LoanStatus)}
                disabled={loan.status === 'completed'}
              >
                {allowedStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
              {loan.status === 'completed' && (
                <span className="ln-form-hint" style={{ color: 'var(--text-muted)' }}>
                  Completed loans are closed and cannot be transitioned.
                </span>
              )}
            </div>

            {(status === 'delinquent' || status === 'defaulted') && (
              <div className="ln-compliance-banner" style={{ fontSize: '0.8rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>
                  Transitioning to <strong>{status}</strong> will trigger automated alerts for the compliance team.
                </span>
              </div>
            )}
          </div>

          <div className="ln-modal-footer">
            <button type="button" className="ln-btn ln-btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="ln-btn ln-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
