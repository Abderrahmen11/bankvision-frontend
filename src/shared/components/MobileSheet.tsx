import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './MobileSheet.css'

interface MobileSheetProps {
  /** Rendered inside the sheet body */
  children: React.ReactNode
  /** Accessible title shown in the grabber header */
  title: string
  onClose: () => void
}

/**
 * Full-width bottom sheet rendered through a portal to <body>.
 *
 * Portaling escapes any ancestor that establishes a containing block for
 * fixed-position descendants (e.g. the navbar's backdrop-filter), which would
 * otherwise collapse the sheet into the navbar's box.
 *
 * Dismissal: overlay tap, close button, or swipe down past the threshold.
 */
export const MobileSheet: React.FC<MobileSheetProps> = ({ children, title, onClose }) => {
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef<number>(0)
  const dragYRef = useRef<number>(0)
  const draggingRef = useRef<boolean>(false)
  const dismissedRef = useRef<boolean>(false)

  // Lock background scroll while the sheet is open
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Escape closes the sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    draggingRef.current = true
    dismissedRef.current = false
    setDragY(0)
    setDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggingRef.current) return
    const delta = e.touches[0].clientY - startYRef.current
    // Only follow downward drags; clamp so the sheet can't be dragged up
    const next = Math.max(0, delta)
    // Refs mirror state so touchend/move see fresh values even when a fast
    // flick batches start/move/end into one render cycle
    dragYRef.current = next
    setDragY(next)
  }, [])

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false
    setDragging(false)
    if (dragYRef.current > 90 && !dismissedRef.current) {
      dismissedRef.current = true
      onClose()
      return
    }
    dragYRef.current = 0
    setDragY(0)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="mobile-sheet-root" data-mobile-sheet>
      {/* Tap-outside dismiss overlay */}
      <div
        className="mobile-sheet-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }}
      >
        {/* Grabber + header: primary swipe handle */}
        <div
          className="mobile-sheet-header"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="mobile-sheet-grabber" aria-hidden="true" />
          <div className="mobile-sheet-title-row">
            <h3 className="mobile-sheet-title">{title}</h3>
            <button
              type="button"
              className="mobile-sheet-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mobile-sheet-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
