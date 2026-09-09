import toast from 'react-hot-toast'

export const showToast = {
  success: (msg: string) =>
    toast.success(msg, {
      duration: 3500,
      style: {
        background: 'rgba(17, 24, 39, 0.92)',
        color: '#f3f4f6',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '10px',
        fontSize: '0.875rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    }),

  error: (msg: string) =>
    toast.error(msg, {
      duration: 4500,
      style: {
        background: 'rgba(17, 24, 39, 0.92)',
        color: '#f3f4f6',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '10px',
        fontSize: '0.875rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    }),

  info: (msg: string) =>
    toast(msg, {
      duration: 3500,
      icon: 'ℹ️',
      style: {
        background: 'rgba(17, 24, 39, 0.92)',
        color: '#f3f4f6',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '10px',
        fontSize: '0.875rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      },
    }),
}
