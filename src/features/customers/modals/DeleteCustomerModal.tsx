import { showToast } from '@/shared/hooks'
import React, { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { customersApi } from '@/features/customers/api/customers'
import type { Customer } from '@/features/customers/types'
import '../pages/CustomerManagement.css'

interface Props {
  customer: Customer
  onClose: () => void
  onSuccess: () => void
}

export const DeleteCustomerModal: React.FC<Props> = ({ customer, onClose, onSuccess }) => {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed) return

    setLoading(true)
    try {
      await customersApi.delete(customer.id)
      showToast.success(`Customer ${customer.full_name} (${customer.customer_number}) deleted successfully.`)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete customer.'
      showToast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cm-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm-modal cm-modal-sm">
        <div className="cm-modal-header">
          <h2>
            <AlertTriangle
              size={18}
              color="var(--rose-500)"
              style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
            />
            Delete Customer Record
          </h2>
          <button className="cm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleDelete}>
          <div className="cm-modal-body">
            <div className="cm-warning-box">
              <strong>Caution:</strong> You are about to delete the customer record for{' '}
              <strong>{customer.full_name}</strong> (<code>{customer.customer_number}</code>).
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                Note: Banking regulations prevent deleting customers with active accounts holding positive balances or outstanding loans.
              </p>
            </div>

            <div className="cm-form-group">
              <label className="cm-label">
                Please type <strong>DELETE</strong> to confirm:
              </label>
              <input
                className="cm-input"
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="cm-modal-footer">
            <button type="button" className="cm-btn cm-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="cm-btn cm-btn-danger"
              disabled={!isConfirmed || loading}
            >
              <Trash2 size={15} />
              {loading ? 'Deleting Customer…' : 'Confirm Deletion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
