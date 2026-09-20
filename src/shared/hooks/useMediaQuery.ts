import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query. Re-renders when the match flips.
 * SSR-safe (defaults to false before mount).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    const syncTimer = setTimeout(() => setMatches(mql.matches), 0)
    mql.addEventListener('change', onChange)
    return () => {
      clearTimeout(syncTimer)
      mql.removeEventListener('change', onChange)
    }
  }, [query])

  return matches
}
