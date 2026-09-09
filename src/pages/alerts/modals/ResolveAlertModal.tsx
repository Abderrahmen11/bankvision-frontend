import React, { useState } from 'react'
import { X, CheckCircle2, Loader2 } from 'lucide-react'
import { alertsApi } from '@/api/alerts'
import type { Alert } from '@/types/alert'
import '../AlertManagement.css'

interface ResolveAlertModalProps {
  alert: Alert
  onClose: () => void
  onSuccess: (updated: Alert) => void
}

export const ResolveAlertModal: React.FC<ResolveAlertModalProps> = ({
  alert,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const updated = await alertsApi.resolve(alert.id, notes || undefined)
      onSuccess(updated)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to resolve alert. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="al-modal-overlay" onClick={onClose}>
      <div className="al-modal" onClick={(e) => e.stopPropagation()}>
        <div className="al-modal-header">
          <h2 className="al-modal-title">
            <CheckCircle2 size={18} style={{ marginRight: 7, verticalAlign: 'middle', color: '#22c55e' }} />
            Resolve Alert
          </h2>
          <button className="al-btn al-btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="al-modal-body">
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(34,197,94,0.07)',
              borderRadius: 9,
              border: '1px solid rgba(34,197,94,0.25)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            You are about to resolve{' '}
            <strong style={{ color: 'var(--primary-400)' }}>{alert.alert_number}</strong>.
            This will mark the alert as <strong style={{ color: '#22c55e' }}>Resolved</strong> and
            record the current timestamp as the resolution time.
          </div>

          <div className="al-form-group">
            <label className="al-form-label">Resolution Notes (optional)</label>
            <textarea
              className="al-form-textarea"
              placeholder="Describe actions taken or reason for resolution…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {error && <p className="al-error-msg">{error}</p>}
        </div>

        <div className="al-modal-footer">
          <button className="al-btn al-btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="al-btn al-btn-resolve"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Resolving…
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Resolve Alert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
