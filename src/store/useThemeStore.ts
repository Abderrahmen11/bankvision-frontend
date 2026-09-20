import { create } from 'zustand'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'bankvision_theme'
const DEFAULT_THEME: Theme = 'dark'

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
  return DEFAULT_THEME
}

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
}

interface ThemeState {
  theme: Theme
  isDark: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Initialise from localStorage at store creation time (runs once)
  const initial = readStoredTheme()

  return {
    theme: initial,
    isDark: initial === 'dark',

    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // ignore
      }
      applyThemeToDom(theme)
      set({ theme, isDark: theme === 'dark' })
    },

    toggleTheme: () => {
      const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
      get().setTheme(next)
    },
  }
})

// Apply the initial theme to the DOM immediately when the store module loads
applyThemeToDom(readStoredTheme())
