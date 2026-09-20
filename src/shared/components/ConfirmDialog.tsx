import { AlertTriangle, X } from 'lucide-react'
import React from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Tints the confirm button with the danger color. */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Shared styled confirmation dialog - replaces native window.confirm for
 * critical actions. Escape closes, backdrop click cancels.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className="confirm-dialog-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-header">
          <AlertTriangle size={16} className={danger ? 'confirm-icon-danger' : 'confirm-icon'} />
          <h3 className="confirm-dialog-title">{title}</h3>
          <button className="confirm-dialog-x" onClick={onCancel} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirm-btn ${danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
