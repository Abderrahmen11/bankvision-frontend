import React from 'react'
import { X } from 'lucide-react'

interface AccountModalShellProps {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
  maxWidth?: number
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
}

export const AccountModalShell: React.FC<AccountModalShellProps> = ({
  title,
  onClose,
  children,
  footer,
  maxWidth,
  onSubmit,
}) => {
  const content = (
    <>
      <div className="am-modal-body">{children}</div>
      <div className="am-modal-footer">{footer}</div>
    </>
  )

  return (
    <div className="am-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="am-modal-header">
          <h2>{title}</h2>
          <button className="am-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {onSubmit ? <form onSubmit={onSubmit}>{content}</form> : content}
      </div>
    </div>
  )
}