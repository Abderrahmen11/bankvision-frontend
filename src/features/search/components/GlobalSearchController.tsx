import React, { useEffect } from 'react'
import { GlobalSearchOverlay } from './GlobalSearchOverlay'
import { useSearchOverlayStore } from '@/store/searchOverlay'

/**
 * Mounts once at the app root (inside the Router) and owns:
 * - the Ctrl+K / ⌘K shortcut on every page, including public pages
 *   (landing, docs) where the navbar - and its inline search bar - do not exist
 * - rendering of the full-screen search overlay
 *
 * On desktop app pages the shortcut focuses the inline navbar search bar
 * (identical to clicking it); everywhere else it opens the overlay.
 */
export const GlobalSearchController: React.FC = () => {
  const isOpen = useSearchOverlayStore((s) => s.isOpen)
  const open = useSearchOverlayStore((s) => s.open)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        // Desktop app pages have the inline bar - focus it (its dropdown then
        // opens via onFocus). Everywhere else, use the full-screen overlay.
        const inlineInput = document.querySelector<HTMLInputElement>('.navbar-search-input')
        const inlineVisible =
          inlineInput && window.matchMedia('(min-width: 1024px)').matches && inlineInput.offsetParent !== null
        if (inlineVisible) {
          inlineInput.focus()
        } else {
          open()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!isOpen) return null
  return <GlobalSearchOverlay />
}
