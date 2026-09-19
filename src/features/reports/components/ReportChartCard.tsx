import React from 'react'

interface ReportChartCardProps {
  children: React.ReactNode
}

export const ReportChartCard: React.FC<ReportChartCardProps> = ({ children }) => (
  <div className="rp-card">{children}</div>
)