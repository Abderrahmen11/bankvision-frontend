import React from 'react'

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  color: string
  bg: string
  accent: string
  subtext?: React.ReactNode
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg, accent, subtext }) => (
  <div className="al-stat-card" style={{ '--card-accent': accent } as React.CSSProperties}>
    <div className="al-stat-icon" style={{ background: bg, color }}>
      {icon}
    </div>
    <span className="al-stat-label">{label}</span>
    <span className="al-stat-value">{value}</span>
    {subtext}
  </div>
)