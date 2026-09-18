import React, { useState } from 'react'
import { sarFilingsApi } from '@/features/alerts/api/sarFilings'
import type { SarFiling, SarStatus } from '@/features/alerts/sarTypes'
import {
  X,
  FileSpreadsheet,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'


interface FileSarModalProps {
  onClose: () => void
  onSuccess: (newSar: SarFiling) => void
}

const CATEGORIES = [
  'Structuring / Smurfing (<$10k Cash)',
  'Rapid Wire Movement / Pass-through Account',
  'Unusual Transaction for Profile / Industry',
  'Suspected Shell Company / Opaque Ownership',
  'PEP (Politically Exposed Person) Sanctions Check',
  'Terrorist Financing Suspicion',
  'Cyber Fraud / Account Takeover Infiltration',
]

export const FileSarModal: React.FC<FileSarModalProps> = ({ onClose, onSuccess }) => {
  const [customerName, setCustomerName] = useState('')
  const [customerNumber, setCustomerNumber] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<SarStatus>('under_review')
  const [actionTaken, setActionTaken] = useState('Account Flagged & Monitoring Active')
  const [narrative, setNarrative] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setError('Please provide the subject customer name.')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please provide a valid suspicious monetary amount.')
      return
    }
    if (!narrative.trim() || narrative.length < 15) {
      setError('Please provide an investigative narrative explaining the suspicious activity (min 15 characters).')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const newFiling = await sarFilingsApi.create({
        customer_name: customerName.trim(),
        customer_number: customerNumber.trim() || undefined,
        category,
        amount: Number(amount),
        status,
        narrative: narrative.trim(),
        action_taken: actionTaken.trim() || undefined,
      })
      onSuccess(newFiling)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record the SAR filing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="al-modal-overlay" onClick={onClose}>
      <div
        className="al-modal al-modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620 }}
      >
        <div className="al-modal-header">
          <div
            className="al-modal-header-icon"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
          >
            <ShieldAlert size={20} />
          </div>
          <div className="al-modal-header-text">
            <h3>File Suspicious Activity Report (SAR)</h3>
            <p>Log a FinCEN/AML regulatory filing or escalation for money laundering surveillance.</p>
          </div>
          <button className="al-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="al-alert-banner error" style={{ margin: '16px 24px 0' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="al-modal-body">
            {/* Subject info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <label className="al-form-label">Subject Customer Name *</label>
                <input
                  type="text"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  placeholder="e.g. John Doe / Global Traders LLC"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="al-form-label">Customer ID / Reference</label>
                <input
                  type="text"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  placeholder="e.g. CUST-0028"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Category & Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16, marginBottom: 14 }}>
              <div>
                <label className="al-form-label">Suspicious Activity Category *</label>
                <select
                  className="al-filter-select"
                  style={{ width: '100%' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="al-form-label">Suspicious Volume *</label>
                <input
                  type="number"
                  step="0.01"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  placeholder="e.g. 75000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Filing Status & Action Taken */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <label className="al-form-label">Filing Stage *</label>
                <select
                  className="al-filter-select"
                  style={{ width: '100%' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SarStatus)}
                >
                  <option value="under_review">Under Compliance Review</option>
                  <option value="draft">Internal Draft</option>
                  <option value="filed">Directly Filed to FinCEN / Regulator</option>
                </select>
              </div>
              <div>
                <label className="al-form-label">Protective Action Taken</label>
                <input
                  type="text"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                />
              </div>
            </div>

            {/* Narrative */}
            <div>
              <label className="al-form-label">Investigative Narrative &amp; Findings *</label>
              <textarea
                className="al-textarea"
                rows={4}
                placeholder="Detail suspicious transaction anomalies, counterparty locations, structuring patterns, or inconsistent business justification…"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="al-modal-footer">
            <button type="button" className="al-btn al-btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="al-btn al-btn-primary"
              disabled={submitting}
              style={{ background: '#ef4444', borderColor: '#dc2626' }}
            >
              {submitting ? (
                'Filing SAR…'
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  Record SAR Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
