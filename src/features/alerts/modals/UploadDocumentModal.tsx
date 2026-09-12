import React, { useState } from 'react'
import {
  X,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react'
import type { Customer } from '@/features/customers/types'
import { customersApi } from '@/features/customers/api/customers'

interface UploadDocumentModalProps {
  customer: Customer
  onClose: () => void
  onSuccess: (updatedCustomer: Customer) => void
}

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'International Passport' },
  { value: 'national_id', label: 'National Identity Card (NIN/CNIC)' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'utility_bill', label: 'Proof of Address (Utility Bill)' },
  { value: 'tax_certificate', label: 'Tax Identification / Form' },
  { value: 'corporate_registry', label: 'Certificate of Incorporation (Corporate)' },
]

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  customer,
  onClose,
  onSuccess,
}) => {
  const [docType, setDocType] = useState('national_id')
  const [docNumber, setDocNumber] = useState('')
  const [issuingCountry, setIssuingCountry] = useState('United States')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attestation, setAttestation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docNumber.trim()) {
      setError('Please provide the document number or reference ID.')
      return
    }
    if (!selectedFile) {
      setError('Please attach or drop a valid verification document image or PDF.')
      return
    }
    if (!attestation) {
      setError('Please confirm the compliance attestation checkbox.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Update customer KYC status to verified
      const updated = await customersApi.update(customer.id, {
        kyc_status: 'verified',
      })
      onSuccess(updated)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Failed to verify document and approve KYC.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="al-modal-overlay" onClick={onClose}>
      <div
        className="al-modal al-modal-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="al-modal-header">
          <div className="al-modal-header-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            <FileCheck size={20} />
          </div>
          <div className="al-modal-header-text">
            <h3>KYC Document Verification</h3>
            <p>
              Verify identity document for {customer.full_name} ({customer.customer_number})
            </p>
          </div>
          <button className="al-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="al-alert-banner error" style={{ margin: '16px 24px 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="al-modal-body">
            {/* Customer Summary Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  CUSTOMER PROFILE
                </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {customer.full_name}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 8 }}>
                  ({customer.customer_number})
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  CURRENT STATUS
                </span>
                <span
                  className="al-badge-status"
                  style={{
                    textTransform: 'capitalize',
                    background:
                      customer.kyc_status === 'pending'
                        ? 'rgba(245,158,11,0.15)'
                        : customer.kyc_status === 'expired'
                        ? 'rgba(239,68,68,0.15)'
                        : 'rgba(34,197,94,0.15)',
                    color:
                      customer.kyc_status === 'pending'
                        ? '#f59e0b'
                        : customer.kyc_status === 'expired'
                        ? '#ef4444'
                        : '#22c55e',
                  }}
                >
                  {customer.kyc_status}
                </span>
              </div>
            </div>

            {/* Document Type & Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="al-form-label">Document Type *</label>
                <select
                  className="al-filter-select"
                  style={{ width: '100%' }}
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="al-form-label">Document / Reference Number *</label>
                <input
                  type="text"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  placeholder="e.g. A93829104"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Issuing Authority & Expiry */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="al-form-label">Issuing Country / Authority</label>
                <input
                  type="text"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  placeholder="e.g. United States / State DMV"
                  value={issuingCountry}
                  onChange={(e) => setIssuingCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="al-form-label">Document Expiry Date</label>
                <input
                  type="date"
                  className="al-search-input"
                  style={{ width: '100%', height: 40 }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div style={{ marginBottom: 16 }}>
              <label className="al-form-label">Attach Identification Document *</label>
              <div
                className={`al-dropzone${dragActive ? ' drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary-400)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                  background: dragActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <FileText size={28} style={{ color: '#22c55e' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for compliance verification
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={32} style={{ color: 'var(--primary-400)', margin: '0 auto 8px' }} />
                    <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Drag &amp; drop document or <span style={{ color: 'var(--primary-400)', textDecoration: 'underline' }}>Browse files</span>
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supports PNG, JPG, PDF up to 10MB
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Attestation Checkbox */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 8,
              }}
            >
              <input
                id="kyc-attest"
                type="checkbox"
                checked={attestation}
                onChange={(e) => setAttestation(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <label
                htmlFor="kyc-attest"
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}
              >
                I attest that I have verified the authenticity and validity of this official government/utility
                identification document against anti-fraud and compliance databases.
              </label>
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
              style={{ background: '#22c55e', borderColor: '#16a34a' }}
            >
              {submitting ? (
                'Verifying & Approving…'
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Verify &amp; Approve KYC
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
