import React from 'react'
import { AlertTriangle, CheckCheck } from 'lucide-react'
import type { ToastType } from '../hooks/useToast'

interface ToastProps {
  msg: string
  type: ToastType
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({ msg, type, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed',
      top: 20,
      right: 24,
      zIndex: 99999,
      padding: '12px 20px',
      borderRadius: 10,
      background: type === 'success' ? '#22c55e' : '#ef4444',
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.875rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}
  >
    {type === 'success' ? <CheckCheck size={16} /> : <AlertTriangle size={16} />}
    {msg}
  </div>
)