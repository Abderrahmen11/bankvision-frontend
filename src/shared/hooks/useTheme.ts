/**
 * useTheme — thin wrapper around useThemeStore.
 *
 * Keeps the same public API ({theme, isDark, toggleTheme, setTheme}) so every
 * existing caller continues to work without modification. The theme state now
 * lives in a Zustand store, eliminating the custom-event bus used previously.
 */
import { useThemeStore } from '@/store/useThemeStore'
export type { Theme } from '@/store/useThemeStore'

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = useThemeStore((s) => s.isDark)
  const setTheme = useThemeStore((s) => s.setTheme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  return { theme, isDark, setTheme, toggleTheme }
}
