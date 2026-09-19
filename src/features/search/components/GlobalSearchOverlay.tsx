import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useGlobalSearch } from '../hooks/useGlobalSearch'
import { GlobalSearchResults } from './GlobalSearchResults'
import { useSearchOverlayStore } from '@/store/searchOverlay'

/**
 * Full-screen search overlay (<1024px in-app, and any size on public pages).
 * Shows the context-aware category panel before typing and instant Fuse.js
 * results once the user types.
 */
export const GlobalSearchOverlay: React.FC = () => {
  const navigate = useNavigate()
  const close = useSearchOverlayStore((s) => s.close)
  const {
    query,
    setQuery,
    clearQuery,
    groups,
    categories,
    activeIndex,
    setActiveIndex,
    indexOfItem,
    handleSearchKeyDown,
  } = useGlobalSearch()

  // Esc closes the overlay even when the input is not focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const navigateToResult = (route: string) => {
    close()
    clearQuery()
    navigate(route)
  }

  // Lock background scroll while the overlay is open
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="global-search-overlay" role="dialog" aria-modal="true" aria-label="Global search">
      <div className="global-search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={18} className="global-search-icon" />
          <input
            autoFocus
            type="text"
            className="global-search-input"
            placeholder="Search sections, settings & pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              handleSearchKeyDown(e, {
                onEscape: close,
                onOpen: navigateToResult,
              })
            }
            aria-label="Global search"
          />
          <button type="button" className="global-search-close" onClick={close} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="global-search-body">
          <GlobalSearchResults
            query={query}
            groups={groups}
            categories={categories}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            indexOfItem={indexOfItem}
            onNavigate={navigateToResult}
          />
        </div>

        <div className="global-search-footer">
          <span>
            <strong>↑</strong>
            <strong>↓</strong> navigate
          </span>
          <span>
            <strong>Enter</strong> open
          </span>
          <span>
            <strong>Esc</strong> close
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
