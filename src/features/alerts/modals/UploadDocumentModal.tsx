import React, { useState } from 'react'
import {
  X,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  FileText,
  Info,
} from 'lucide-react'
import type { Customer } from '@/features/customers/types'
import { customersApi } from '@/features/customers/api/customers'
import { getErrorMessage } from '@/shared/utils'

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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']

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
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed size is 10 MB.`
    }

    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidMime && !hasValidExt) {
      return `File type not supported. Allowed formats: PNG, JPG, JPEG, and PDF.`
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setSelectedFile(null)
      } else {
        setError(null)
        setSelectedFile(file)
      }
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
      const file = e.dataTransfer.files[0]
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setSelectedFile(null)
      } else {
        setError(null)
        setSelectedFile(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docNumber.trim()) {
      setError('Please provide the document number or reference ID.')
      return
    }
    if (!selectedFile) {
      setError('Please attach an identification document file (PNG, JPG, or PDF).')
      return
    }
    const fileError = validateFile(selectedFile)
    if (fileError) {
      setError(fileError)
      return
    }
    if (!attestation) {
      setError('Please confirm the compliance attestation checkbox before submitting.')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('document_type', docType)
      formData.append('document_number', docNumber.trim())
      if (issuingCountry.trim()) {
        formData.append('issuing_country', issuingCountry.trim())
      }
      if (expiryDate) {
        formData.append('expiry_date', expiryDate)
      }
      formData.append('file', selectedFile)
      formData.append('attestation', '1')
      if (notes.trim()) {
        formData.append('notes', notes.trim())
      }

      const result = await customersApi.uploadKycDocument(
        customer.id,
        formData,
        (percent) => {
          setUploadProgress(percent)
        }
      )

      onSuccess(result.customer)
    } catch (err: unknown) {
      setUploadProgress(null)
      const errStatus = (err as { status?: number })?.status
      if (errStatus === 413) {
        setError('The uploaded file is too large. Maximum allowed file size is 10 MB.')
      } else if (errStatus === 404) {
        setError('Customer profile was not found on the server.')
      } else if (errStatus === 403) {
        setError('Access denied: You do not have permission to upload KYC documents for this customer.')
      } else {
        setError(getErrorMessage(err, 'Failed to upload document and verify customer KYC.'))
      }
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
          <div
            className="al-modal-header-icon"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
          >
            <FileCheck size={20} />
          </div>
          <div className="al-modal-header-text">
            <h3>KYC Document Verification &amp; Upload</h3>
            <p>
              Upload and verify identity document for {customer.full_name} ({customer.customer_number})
            </p>
          </div>
          <button className="al-modal-close-btn" onClick={onClose} aria-label="Close" disabled={submitting}>
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
            {/* Backend Storage Notice */}
            <div
              className="cm-kyc-notice-box"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <Info size={17} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                  Secure Government Document Ledger
                </strong>
                <span>
                  Uploaded identity files are encrypted and securely stored on the private banking ledger disk for regulatory compliance, audit retention, and supervisory examination. Submitting updates customer status to <strong>Verified</strong>.
                </span>
              </div>
            </div>

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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Document Upload Area */}
            <div style={{ marginBottom: 16 }}>
              <label className="al-form-label">Attach Identification Document File *</label>
              <div
                className={`al-dropzone${dragActive ? ' drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary-400)' : selectedFile ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                  background: dragActive
                    ? 'rgba(99,102,241,0.08)'
                    : selectedFile
                    ? 'rgba(34,197,94,0.03)'
                    : 'rgba(255,255,255,0.02)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => !submitting && document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png,.pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <FileText size={28} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for private vault storage
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
                      Supports PNG, JPG, PDF (max 10 MB). Stored securely on private banking disk.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Verification Notes */}
            <div style={{ marginBottom: 16 }}>
              <label className="al-form-label">Verification Notes (Optional)</label>
              <textarea
                className="al-search-input"
                style={{ width: '100%', height: 64, padding: '8px 12px', resize: 'vertical' }}
                placeholder="e.g. Scanned in branch, matched against national ID database..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Real Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="cm-kyc-progress-wrap" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {uploadProgress < 100 ? 'Uploading document to private vault...' : 'Finalizing cryptographic ledger record...'}
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{uploadProgress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #38bdf8, #22c55e)',
                      transition: 'width 0.2s ease-in-out',
                    }}
                  />
                </div>
              </div>
            )}

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
                disabled={submitting}
                style={{ marginTop: 3 }}
              />
              <label
                htmlFor="kyc-attest"
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}
              >
                I attest that I have examined and verified the authenticity of this official government/utility identification document matching reference ID "{docNumber || '...'}" against anti-fraud and regulatory databases.
              </label>
            </div>
          </div>

          <div className="al-modal-footer">
            <button
              type="button"
              className="al-btn al-btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="al-btn al-btn-primary"
              disabled={submitting}
              style={{ background: '#22c55e', borderColor: '#16a34a' }}
            >
              {submitting ? (
                uploadProgress !== null && uploadProgress < 100 ? (
                  `Uploading (${uploadProgress}%)…`
                ) : (
                  'Verifying & Storing…'
                )
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Upload &amp; Verify Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
