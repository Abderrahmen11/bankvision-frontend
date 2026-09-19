import { useAuth } from '@/shared/hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getCategories,
  itemsForContext,
  matchesQuery,
  type SearchCategory,
  type SearchSectionItem,
} from '@/features/search/searchSections'

export interface GlobalSearchItem {
  id: string
  kind: SearchSectionItem['kind'] | 'category'
  group: string
  title: string
  subtitle: string
  route: string
  icon: SearchSectionItem['icon']
}

export interface SearchGroup {
  group: string
  icon: SearchSectionItem['icon']
  items: GlobalSearchItem[]
}

/**
 * Global search over the static section directory — pure frontend, zero API
 * calls. Matching is a plain case-insensitive .filter() over ~40 items, so
 * results are instant on every keystroke. With an empty query the hook
 * returns context- and role-aware categories for the "Jump to" panel.
 */
export function useGlobalSearch() {
  const { user } = useAuth()
  const role = user?.role
  const location = useLocation()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmed = query.trim().toLowerCase()

  /** Categories for the empty-query panel (context- and role-aware). */
  const categories = useMemo<SearchCategory[]>(
    () => getCategories(location.pathname, role),
    [location.pathname, role]
  )

  /**
   * Matching items. On module pages the item whose route matches the current
   * path is prioritized to the top; on public pages only the landing/docs
   * entries are offered.
   */
  const results = useMemo<SearchGroup[]>(() => {
    if (!trimmed) return []
    const visible = itemsForContext(location.pathname, role).filter((item) =>
      matchesQuery(item, trimmed)
    )
    // Order: current section first, then everything else by group/title
    const current = visible.filter((item) => location.pathname.startsWith(item.route) && item.route !== '/')
    const rest = visible.filter((item) => !current.includes(item))

    const ordered = [...current, ...rest].sort(
      (a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title)
    )

    const groups: SearchGroup[] = []
    for (const item of ordered) {
      let group = groups.find((g) => g.group === item.group)
      if (!group) {
        group = { group: item.group, icon: item.icon, items: [] }
        groups.push(group)
      }
      group.items.push({
        id: item.id,
        kind: item.kind,
        group: item.group,
        title: item.title,
        subtitle: item.subtitle,
        route: item.route,
        icon: item.icon,
      })
    }
    return groups
  }, [trimmed, location.pathname, role])

  /** Arrow-key walk: categories before typing, grouped results while typing. */
  const flatItems = useMemo<GlobalSearchItem[]>(() => {
    if (!trimmed) {
      return categories.map((c) => ({
        id: `cat-${c.key}`,
        kind: 'category' as const,
        group: 'Categories',
        title: c.label,
        subtitle: c.description,
        route: c.route,
        icon: c.icon,
      }))
    }
    return results.flatMap((g) => g.items)
  }, [trimmed, categories, results])

  useEffect(() => {
    const timer = setTimeout(() => setActiveIndex(-1), 0)
    return () => clearTimeout(timer)
  }, [flatItems])

  const indexOfItem = useCallback(
    (itemId: string) => flatItems.findIndex((i) => i.id === itemId),
    [flatItems]
  )

  /** Shared keyboard model for the dropdown and the mobile overlay. */
  const handleSearchKeyDown = useCallback(
    (
      e: { key: string; preventDefault: () => void },
      handlers: { onEscape: () => void; onOpen: (route: string) => void }
    ) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (flatItems.length > 0) setActiveIndex((i) => (i + 1) % flatItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (flatItems.length > 0) setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === 'Enter') {
        const item = flatItems[activeIndex] ?? flatItems[0]
        if (item) {
          e.preventDefault()
          handlers.onOpen(item.route)
        }
      } else if (e.key === 'Escape') {
        handlers.onEscape()
      }
    },
    [flatItems, activeIndex]
  )

  return {
    query,
    setQuery,
    clearQuery: useCallback(() => setQuery(''), []),
    groups: results,
    flatItems,
    categories,
    activeIndex,
    setActiveIndex,
    indexOfItem,
    handleSearchKeyDown,
  }
}
