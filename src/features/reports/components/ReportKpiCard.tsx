import React from 'react'

interface ReportKpiCardProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  accent: string
  valueClassName?: string
  subtext?: React.ReactNode
  footer?: React.ReactNode
}

export const ReportKpiCard: React.FC<ReportKpiCardProps> = ({
  icon,
  label,
  value,
  accent,
  valueClassName,
  subtext,
  footer,
}) => (
  <div className="rp-kpi-card" style={{ '--rp-kpi-color': accent } as React.CSSProperties}>
    <div className="rp-kpi-icon">{icon}</div>
    <div className="rp-kpi-label">{label}</div>
    <div className={`rp-kpi-value${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</div>
    {footer ?? <div className="rp-kpi-sub">{subtext}</div>}
  </div>
)