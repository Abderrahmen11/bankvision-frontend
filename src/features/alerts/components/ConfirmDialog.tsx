import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  subtitle?: React.ReactNode
  message: string
  confirmLabel: string
  confirmColor: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  subtitle,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  loading,
}) => {
  const isSuccess = confirmColor === '#22c55e'

  return (
    <div className="al-modal-overlay" onClick={onCancel}>
      <div className="al-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="al-modal-header">
          <div
            className="al-modal-header-icon"
            style={{
              background: isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: confirmColor,
            }}
          >
            {isSuccess ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="al-modal-header-text">
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className="al-modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="al-modal-footer">
          <button type="button" className="al-btn al-btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="al-btn al-btn-primary"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: confirmColor,
              borderColor: isSuccess ? '#16a34a' : '#dc2626',
            }}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}