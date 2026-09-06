import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'bankvision_theme'
const DEFAULT_THEME: Theme = 'dark'

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'dark' || saved === 'light') {
        return saved
      }
      return DEFAULT_THEME
    } catch {
      return DEFAULT_THEME
    }
  })

  // Apply theme to document element
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement
    root.setAttribute('data-theme', newTheme)
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme)
      } catch (err) {
        console.warn('Failed to save theme in localStorage:', err)
      }
      setThemeState(newTheme)
      applyTheme(newTheme)
    },
    [applyTheme]
  )

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }
}
