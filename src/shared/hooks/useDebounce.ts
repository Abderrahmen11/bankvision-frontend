import { useEffect, useState, useRef } from 'react'

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false
    }
    return true
  }

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }
  return true
}

/**
 * Debounces a value by the given delay (ms).
 * The returned value only updates after the caller has stopped changing
 * the input for `delay` milliseconds.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value)
  const prevValueRef = useRef<T>(value)

  useEffect(() => {
    if (isDeepEqual(prevValueRef.current, value)) {
      return
    }
    prevValueRef.current = value

    const timer = setTimeout(() => {
      setDebounced((current) => (isDeepEqual(current, value) ? current : value))
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

