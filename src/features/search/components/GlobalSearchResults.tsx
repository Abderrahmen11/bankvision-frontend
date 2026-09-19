import React, { useEffect, useRef } from 'react'
import { Search, SearchX } from 'lucide-react'
import type { SearchGroup, GlobalSearchItem } from '../hooks/useGlobalSearch'
import type { SearchCategory } from '../searchSections'

interface GlobalSearchResultsProps {
  query: string
  groups: SearchGroup[]
  /** Context/role-aware categories shown before typing. */
  categories: SearchCategory[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  indexOfItem: (itemId: string) => number
  onNavigate: (route: string) => void
}

/**
 * Shared rendering for every global-search surface (navbar dropdown and the
 * full-screen overlay):
 * - empty query  → category panel (context- and role-aware)
 * - typing       → instant grouped results from the static section directory
 * - no matches   → empty state with category suggestions
 * Everything is synchronous - there are no loading states.
 */
export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({
  query,
  groups,
  categories,
  activeIndex,
  setActiveIndex,
  indexOfItem,
  onNavigate,
}) => {
  const activeRef = useRef<HTMLElement | null>(null)
  const trimmed = query.trim()

  // Keep the keyboard-highlighted row in view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  /* Category panel - before typing */
  if (!trimmed) {
    return (
      <div className="search-groups" role="listbox" aria-label="Search categories">
        <div className="search-panel-title">Jump to</div>
        <div className="search-category-grid">
          {categories.map((cat) => {
            const flatIdx = categories.indexOf(cat)
            const Icon = cat.icon
            const isActive = flatIdx === activeIndex
            return (
              <button
                key={cat.key}
                type="button"
                role="option"
                aria-selected={isActive}
                ref={isActive ? (el) => { activeRef.current = el } : undefined}
                className={`search-category-card ${isActive ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(flatIdx)}
                onClick={() => onNavigate(cat.route)}
              >
                <span className="search-category-icon">
                  <Icon size={16} />
                </span>
                <span className="search-category-body">
                  <span className="search-category-label">{cat.label}</span>
                  <span className="search-category-desc">{cat.description}</span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="search-panel-hint">
          Type to filter sections instantly - everything is local.
        </p>
      </div>
    )
  }

  /* No matches - with suggestions */
  if (groups.length === 0) {
    return (
      <div className="search-state-panel" role="status">
        <SearchX size={18} />
        <p>
          No matches for “{trimmed}”
          <span className="search-state-sub">Check the spelling or try a broader term.</span>
        </p>
        <div className="search-suggestions">
          <span className="search-suggestions-label">Suggestions:</span>
          {categories.slice(0, 4).map((cat) => (
            <button
              key={cat.key}
              type="button"
              className="search-suggestion-chip"
              onClick={() => onNavigate(cat.route)}
            >
              <cat.icon size={12} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* Instant grouped results */
  return (
    <div className="search-groups" role="listbox" aria-label="Global search results">
      {groups.map((group: SearchGroup) => {
        const GroupIcon = group.icon
        return (
          <div key={group.group} className="search-group">
            <div className="search-group-header">
              <GroupIcon size={13} />
              <span>{group.group}</span>
              <span className="search-group-count">{group.items.length}</span>
            </div>
            {group.items.map((item: GlobalSearchItem) => {
              const flatIdx = indexOfItem(item.id)
              const isActive = flatIdx === activeIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  ref={isActive ? (el) => { activeRef.current = el } : undefined}
                  className={`search-result-item ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(flatIdx)}
                  onClick={() => onNavigate(item.route)}
                >
                  <span className="search-result-bullet">
                    <Search size={13} />
                  </span>
                  <span className="search-result-body">
                    <span className="search-result-title">{item.title}</span>
                    <span className="search-result-sub">{item.subtitle}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
