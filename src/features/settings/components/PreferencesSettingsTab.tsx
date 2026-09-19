import { showToast, useTheme, type Theme } from '@/shared/hooks'
import React, { useState } from 'react'
import { Moon, Sun, MonitorCog, Save, Palette as PaletteIcon, Check } from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settings'
import type { ThemePreference, UserPreferences, UserSettings } from '@/features/settings/types'
import { GlassCard, StButton, StSkeleton } from './SettingsUI'

interface PreferencesSettingsTabProps {
  settings: UserSettings | null
  isLoading: boolean
}

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: React.ReactNode
}> = [
  { value: 'dark', label: 'Dark', description: 'Signature glassmorphism night mode', icon: <Moon size={18} /> },
  { value: 'light', label: 'Light', description: 'Bright surfaces for daylight work', icon: <Sun size={18} /> },
  { value: 'system', label: 'System', description: 'Follow your operating system setting', icon: <MonitorCog size={18} /> },
]

/** Resolve the effective theme for a stored preference. */
function resolveTheme(pref: ThemePreference): Theme {
  if (pref !== 'system') return pref
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const PreferencesSettingsTab: React.FC<PreferencesSettingsTabProps> = ({ settings, isLoading }) => {
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<UserPreferences | null>(settings?.preferences ?? null)
  const [syncedFrom, setSyncedFrom] = useState<UserSettings | null>(settings)
  const [savedTheme, setSavedTheme] = useState<ThemePreference>(settings?.preferences?.theme ?? 'dark')
  const [isSaving, setIsSaving] = useState(false)

  // Sync from the loaded settings during render (avoids setState-in-effect)
  if (settings && settings !== syncedFrom && !isSaving) {
    setSyncedFrom(settings)
    setPrefs(settings.preferences)
    setSavedTheme(settings.preferences.theme)
  }

  if (isLoading || !prefs) {
    return (
      <div className="st-tab-grid st-tab-grid-2">
        <StSkeleton height={280} className="st-span-2" />
      </div>
    )
  }

  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleThemeChange = (next: ThemePreference) => {
    update('theme', next)
    // Apply immediately for instant feedback - saved on "Save Preferences"
    setTheme(resolveTheme(next))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await settingsApi.updatePreferences(prefs)
      setPrefs(saved)
      setSavedTheme(saved.theme)
      showToast.success('Preferences saved.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to save preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="st-tab-grid st-tab-grid-2">
      {/* ── Theme ── */}
      <GlassCard
        title="Appearance"
        subtitle="Choose how BankVision looks on this device"
        icon={<PaletteIcon size={17} />}
        className="st-span-2"
      >
        <div className="st-theme-grid">
          {THEME_OPTIONS.map((option) => {
            const selected = prefs.theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={`st-theme-card ${selected ? 'selected' : ''}`}
                onClick={() => handleThemeChange(option.value)}
                aria-pressed={selected}
              >
                <span className="st-theme-preview" data-theme-preview={option.value}>
                  {option.icon}
                </span>
                <span className="st-theme-copy">
                  <span className="st-theme-label">{option.label}</span>
                  <span className="st-theme-desc">{option.description}</span>
                </span>
                {selected && (
                  <span className="st-theme-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </GlassCard>

      {/* ── Save bar ── */}
      <div className="st-save-banner st-span-2">
        <p>
          {prefs.theme !== savedTheme
            ? 'Theme preview is active - save to make it your default.'
            : 'Preferences are stored per account and follow you across devices.'}
        </p>
        <StButton icon={<Save size={15} />} loading={isSaving} onClick={handleSave}>
          Save Preferences
        </StButton>
      </div>
    </div>
  )
}
