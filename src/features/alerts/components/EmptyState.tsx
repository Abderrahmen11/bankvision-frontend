import React from 'react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  message: string
  action?: React.ReactNode
  style?: React.CSSProperties
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action, style }) => (
  <div className="al-empty" style={style}>
    <div className="al-empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action}
  </div>
)