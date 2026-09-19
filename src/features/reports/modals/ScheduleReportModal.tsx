import React, { useState } from 'react'
import { X, Calendar, Mail, AlertTriangle } from 'lucide-react'

interface ScheduleReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState('full')
  const [frequency, setFrequency] = useState('weekly')
  const [format, setFormat] = useState('pdf')
  const [recipients, setRecipients] = useState('executive-team@bankvision.internal')
  const [deliveryTime, setDeliveryTime] = useState('08:00')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #1a1f2e)',
          border: '1px solid var(--border-subtle, #2d3748)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle, #2d3748)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9' }}>
                Schedule Automated Report
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Deliver recurring analytics to executive inboxes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Informational banner explaining backend status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#f59e0b',
              fontSize: '0.82rem',
              lineHeight: 1.45
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>
                Automated Scheduling Not Configured
              </strong>
              <span>
                Recurring automated report delivery requires an enterprise background queue worker (such as Redis or Horizon) which is not configured on this server. Please use the immediate <strong>CSV</strong>, <strong>Excel</strong>, or <strong>PDF</strong> export buttons in the dashboard toolbar.
              </span>
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
              Report Focus
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="rp-date-input"
              style={{ width: '100%', padding: '0.6rem' }}
            >
              <option value="full">Executive Master Report (Comprehensive)</option>
              <option value="financial">Financial Statements (P&amp;L, Balance Sheet, Cash Flow)</option>
              <option value="transactions">Transaction Volume &amp; High-Value Transfers</option>
              <option value="loans">Loan Portfolio &amp; Delinquency Analytics</option>
              <option value="risk">Risk &amp; Compliance Audit Package</option>
            </select>
          </div>

          {/* Frequency & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="rp-date-input"
                style={{ width: '100%', padding: '0.6rem' }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Monday morning)</option>
                <option value="monthly">Monthly (1st of month)</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                Delivery Time (UTC)
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="rp-date-input"
                style={{ width: '100%', padding: '0.6rem' }}
              />
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
              Document Delivery Format
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'pdf', label: 'PDF Document' },
                { id: 'excel', label: 'Excel (.xlsx)' },
                { id: 'csv', label: 'CSV Bundle' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: `1px solid ${format === fmt.id ? '#6366f1' : '#2d3748'}`,
                    background: format === fmt.id ? 'rgba(99, 102, 241, 0.15)' : '#0f1117',
                    color: format === fmt.id ? '#818cf8' : '#94a3b8',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
              Recipient Emails (comma-separated)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="ceo@bankvision.internal, cfo@bankvision.internal"
                className="rp-date-input"
                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', boxSizing: 'border-box' }}
                required
              />
              <Mail
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #2d3748',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#64748b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Automated scheduling worker is not configured on this server"
            >
              <AlertTriangle size={15} />
              Scheduling Not Configured
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
