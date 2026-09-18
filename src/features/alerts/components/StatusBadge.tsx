import React from 'react'
import { getStatusConfig } from '../alertHelpers'

interface StatusBadgeProps {
  status: string
  variant: 'kyc' | 'risk' | 'sar' | 'alert'
  tone?: 'pending' | 'expired' | 'verified'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, tone = status as StatusBadgeProps['tone'] }) => {
  if (variant === 'alert') {
    const config = getStatusConfig(status)
    return (
      <span className="al-badge" style={{ color: config.color, background: config.bg }}>
        {config.label}
      </span>
    )
  }

  if (variant === 'risk') {
    return (
      <span className={`al-badge-severity ${status === 'high' ? 'high' : status === 'medium' ? 'medium' : 'low'}`}>
        <span className="al-dot" />
        {status}
      </span>
    )
  }

  const isKycPending = tone === 'pending'
  const isKycExpired = tone === 'expired'
  const background = variant === 'kyc'
    ? isKycPending
      ? 'rgba(245,158,11,0.15)'
      : isKycExpired
      ? 'rgba(239,68,68,0.15)'
      : 'rgba(34,197,94,0.15)'
    : status === 'filed'
    ? 'rgba(34,197,94,0.15)'
    : status === 'under_review'
    ? 'rgba(245,158,11,0.15)'
    : status === 'escalated'
    ? 'rgba(239,68,68,0.2)'
    : 'rgba(148,163,184,0.15)'
  const color = variant === 'kyc'
    ? isKycPending ? '#f59e0b' : isKycExpired ? '#ef4444' : '#22c55e'
    : status === 'filed' ? '#22c55e' : status === 'under_review' ? '#f59e0b' : status === 'escalated' ? '#ef4444' : 'var(--text-muted)'

  return (
    <span
      className="al-badge-status"
      style={{
        textTransform: variant === 'sar' ? 'uppercase' : 'capitalize',
        ...(variant === 'sar' ? { fontSize: '0.7rem' } : {}),
        background,
        color,
      }}
    >
      {variant === 'sar' ? status.replace('_', ' ') : status}
    </span>
  )
}