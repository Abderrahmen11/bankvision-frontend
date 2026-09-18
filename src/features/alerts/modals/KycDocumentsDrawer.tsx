import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  FileText,
  Download,
  Trash2,
  Calendar,
  Globe,
  User,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileCheck,
  Plus,
} from 'lucide-react'
import type { Customer, KycDocument } from '@/features/customers/types'
import { customersApi } from '@/features/customers/api/customers'
import { getErrorMessage } from '@/shared/utils'

interface KycDocumentsDrawerProps {
  customer: Customer
  canUpload?: boolean
  isAdmin?: boolean
  onClose: () => void
  onOpenUpload?: () => void
  onDocumentDeleted?: () => void
}

export const KycDocumentsDrawer: React.FC<KycDocumentsDrawerProps> = ({
  customer,
  canUpload = false,
  isAdmin = false,
  onClose,
  onOpenUpload,
  onDocumentDeleted,
}) => {
  const [documents, setDocuments] = useState<KycDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await customersApi.listKycDocuments(customer.id)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to retrieve KYC documents for this customer.'))
    } finally {
      setLoading(false)
    }
  }, [customer.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDocuments()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchDocuments])

  const handleDownload = async (doc: KycDocument) => {
    setDownloadingId(doc.id)
    setFeedbackMsg(null)
    try {
      await customersApi.downloadKycDocument(doc.id, doc.file_name)
      setFeedbackMsg({ type: 'success', text: `Downloaded "${doc.file_name}".` })
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: getErrorMessage(err, `Failed to download "${doc.file_name}".`),
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (doc: KycDocument) => {
    if (!window.confirm(`Are you sure you want to permanently delete document "${doc.file_name}"? This action is irreversible.`)) {
      return
    }

    setDeletingId(doc.id)
    setFeedbackMsg(null)
    try {
      await customersApi.deleteKycDocument(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      setFeedbackMsg({ type: 'success', text: `Document "${doc.file_name}" deleted.` })
      onDocumentDeleted?.()
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: getErrorMessage(err, `Failed to delete document "${doc.file_name}".`),
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDocType = (type: string): string => {
    const map: Record<string, string> = {
      passport: 'International Passport',
      national_id: 'National Identity Card',
      drivers_license: "Driver's License",
      utility_bill: 'Proof of Address (Utility Bill)',
      tax_certificate: 'Tax Identification / Form',
      corporate_registry: 'Certificate of Incorporation',
    }
    return map[type] || type.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <div className="al-modal-overlay cm-kyc-drawer-overlay" onClick={onClose}>
      <div
        className="al-modal cm-kyc-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="al-modal-header" style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
          <div
            className="al-modal-header-icon"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
          >
            <FileText size={20} />
          </div>
          <div className="al-modal-header-text">
            <h3>KYC Identity Documents</h3>
            <p>
              {customer.full_name} ({customer.customer_number}) • {documents.length} record{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canUpload && onOpenUpload && (
              <button
                className="al-btn al-btn-sm al-btn-secondary"
                onClick={() => {
                  onClose()
                  onOpenUpload()
                }}
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              >
                <Plus size={14} />
                Upload New
              </button>
            )}
            <button className="al-modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div
            className={`al-alert-banner ${feedbackMsg.type === 'success' ? 'success' : 'error'}`}
            style={{ margin: '12px 24px 0' }}
          >
            {feedbackMsg.type === 'success' ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div
          className="al-modal-body cm-kyc-drawer-body"
          style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}
        >
          {loading ? (
            <div className="al-loading" style={{ padding: '40px 0' }}>
              <div className="al-spinner" />
              <p>Loading customer identification documents…</p>
            </div>
          ) : error ? (
            <div className="al-alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : documents.length === 0 ? (
            <div
              className="cm-kyc-empty-state"
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px dashed var(--border-color, rgba(255,255,255,0.1))',
              }}
            >
              <FileCheck size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                No Documents Uploaded Yet
              </h4>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                This customer currently has no verification files stored in the private ledger vault.
              </p>
              {canUpload && onOpenUpload && (
                <button
                  className="al-btn al-btn-primary al-btn-sm"
                  onClick={() => {
                    onClose()
                    onOpenUpload()
                  }}
                >
                  <Plus size={14} /> Upload First Document
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {documents.map((doc) => {
                const isDownloading = downloadingId === doc.id
                const isDeleting = deletingId === doc.id

                return (
                  <div
                    key={doc.id}
                    className="cm-kyc-doc-card"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                      borderRadius: 10,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Top Row: Type & Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="cm-kyc-type-pill"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(56,189,248,0.15)',
                            color: '#38bdf8',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {formatDocType(doc.document_type)}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {doc.document_number}
                        </strong>
                      </div>
                      <span
                        className="al-badge-status"
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          background:
                            doc.status === 'verified'
                              ? 'rgba(34,197,94,0.15)'
                              : doc.status === 'pending'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(239,68,68,0.15)',
                          color:
                            doc.status === 'verified'
                              ? '#22c55e'
                              : doc.status === 'pending'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {doc.status}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '8px 16px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {doc.issuing_country && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>Issuer: {doc.issuing_country}</span>
                        </div>
                      )}
                      {doc.expiry_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>Expires: {doc.expiry_date}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>Uploaded: {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}</span>
                      </div>
                      {doc.uploaded_by && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>By: {doc.uploaded_by.name} ({doc.uploaded_by.role})</span>
                        </div>
                      )}
                    </div>

                    {/* File Attachment & Actions Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileText size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.file_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          ({doc.file_size_formatted || `${Math.round(doc.file_size / 1024)} KB`})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          className="al-btn al-btn-secondary al-btn-sm"
                          onClick={() => handleDownload(doc)}
                          disabled={isDownloading}
                          title="Stream file from private vault"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          <Download size={13} />
                          {isDownloading ? 'Downloading…' : 'Download'}
                        </button>

                        {isAdmin && (
                          <button
                            className="al-btn al-btn-ghost al-btn-sm"
                            onClick={() => handleDelete(doc)}
                            disabled={isDeleting}
                            title="Delete document (Admin only)"
                            style={{ color: '#ef4444', padding: '4px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes if any */}
                    {doc.notes && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          borderLeft: '2px solid rgba(255,255,255,0.1)',
                          paddingLeft: 8,
                        }}
                      >
                        Note: {doc.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="al-modal-footer"
          style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
        >
          <button type="button" className="al-btn al-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
