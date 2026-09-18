import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastState {
  msg: string
  type: ToastType
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast({ msg, type })
    timeoutRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  return { toast, showToast }
}