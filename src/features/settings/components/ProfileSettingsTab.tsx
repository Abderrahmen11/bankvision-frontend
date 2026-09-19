import { showToast } from '@/shared/hooks'
import React, { useRef, useState } from 'react'
import { Camera, KeyRound, Mail, Phone, Save, Trash2, User as UserIcon, Lock, EyeOff, Eye } from 'lucide-react'
import { settingsApi } from '@/features/settings/api/settings'
import type { User } from '@/shared/types/user'
import type { UserSettings, UpdateProfilePayload } from '@/features/settings/types'
import { GlassCard, FormField, StButton } from './SettingsUI'

interface ProfileSettingsTabProps {
  user: User | null
  settings: UserSettings | null
  isLoading: boolean
  onUserUpdated: (user: User) => void
}

type FieldErrors = Record<string, string>

/** Extract per-field validation errors from an enhanced axios error. */
function extractFieldErrors(err: unknown): FieldErrors {
  const e = err as { errors?: Record<string, string[]>; message?: string }
  const errors: FieldErrors = {}
  if (e?.errors) {
    for (const [key, messages] of Object.entries(e.errors)) {
      if (messages?.length) errors[key] = messages[0]
    }
  }
  return errors
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  user,
  settings,
  isLoading,
  onUserUpdated,
}) => {
  // ── Profile info form state ────────────────────────────────────────────────
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [profileSyncedUser, setProfileSyncedUser] = useState(user)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({})

  // Adjust form state during render when the user record changes (React-endorsed
  // alternative to a setState-in-effect sync)
  if (user && user !== profileSyncedUser) {
    setProfileSyncedUser(user)
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }

  // ── Password form state ────────────────────────────────────────────────────
  const emptyPasswordForm = { current_password: '', password: '', password_confirmation: '' }
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})
  const [showPasswords, setShowPasswords] = useState(false)

  // ── Avatar state ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(undefined)
  const avatarUrl = avatarOverride !== undefined ? avatarOverride : user?.avatar_url ?? null

  const updateField = (field: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }))
    setProfileErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileErrors({})
    try {
      const payload: UpdateProfilePayload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim() || undefined,
      }
      const updated = await settingsApi.updateProfile(payload)
      onUserUpdated({ ...user, ...updated })
      showToast.success('Profile updated successfully.')
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      setProfileErrors(fieldErrors)
      showToast.error(
        Object.values(fieldErrors)[0] ?? (err instanceof Error ? err.message : 'Failed to update profile.')
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordErrors({ password_confirmation: 'Password confirmation does not match.' })
      return
    }
    setIsSavingPassword(true)
    setPasswordErrors({})
    try {
      await settingsApi.updatePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      showToast.success('Password changed successfully.')
    } catch (err) {
      const fieldErrors = extractFieldErrors(err)
      setPasswordErrors(fieldErrors)
      showToast.error(
        Object.values(fieldErrors)[0] ?? (err instanceof Error ? err.message : 'Failed to change password.')
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast.error('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast.error('Image must be smaller than 2 MB.')
      return
    }
    setIsUploadingAvatar(true)
    try {
      const result = await settingsApi.uploadAvatar(file)
      setAvatarOverride(result.avatar_url)
      if (user) {
        onUserUpdated({ ...user, avatar: result.avatar, avatar_url: result.avatar_url })
      }
      showToast.success('Profile picture updated.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to upload picture.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true)
    try {
      await settingsApi.removeAvatar()
      setAvatarOverride(null)
      if (user) {
        onUserUpdated({ ...user, avatar: null, avatar_url: null })
      }
      showToast.success('Profile picture removed.')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to remove picture.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BV'

  if (isLoading) {
    return (
      <div className="st-tab-grid">
        <div className="st-skeleton st-skeleton-card" />
        <div className="st-skeleton st-skeleton-card" />
      </div>
    )
  }

  return (
    <div className="st-tab-grid">
      {/* ── Identity + Avatar ── */}
      <GlassCard
        title="Profile Picture"
        subtitle="A square image up to 2 MB works best"
        icon={<Camera size={17} />}
      >
        <div className="st-avatar-section">
          <div className="st-avatar-ring">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name || 'Profile'} className="st-avatar-img" />
            ) : (
              <span className="st-avatar-initials">{initials}</span>
            )}
            {isUploadingAvatar && <span className="st-avatar-overlay"><Camera size={16} /></span>}
          </div>

          <div className="st-avatar-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarSelect}
            />
            <StButton
              variant="ghost"
              icon={<Camera size={15} />}
              loading={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Picture
            </StButton>
            {avatarUrl && (
              <StButton
                variant="danger"
                icon={<Trash2 size={15} />}
                disabled={isUploadingAvatar}
                onClick={handleRemoveAvatar}
              >
                Remove
              </StButton>
            )}
            <p className="st-avatar-meta">
              JPG, PNG or WebP · max 2 MB. Your picture appears in the sidebar and navbar.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ── Profile Information ── */}
      <GlassCard title="Personal Information" subtitle="How colleagues see you across BankVision" icon={<UserIcon size={17} />}>
        <form onSubmit={handleSaveProfile} className="st-form">
          <div className="st-form-row">
            <FormField label="Full Name" htmlFor="profile-name" error={profileErrors.name}>
              <div className="st-input-wrap">
                <UserIcon size={15} className="st-input-icon" />
                <input
                  id="profile-name"
                  className="st-input"
                  value={profile.name}
                  onChange={updateField('name')}
                  placeholder="e.g. Alexandra Morgan"
                  required
                />
              </div>
            </FormField>

            <FormField label="Email Address" htmlFor="profile-email" error={profileErrors.email}>
              <div className="st-input-wrap">
                <Mail size={15} className="st-input-icon" />
                <input
                  id="profile-email"
                  type="email"
                  className="st-input"
                  value={profile.email}
                  onChange={updateField('email')}
                  placeholder="name@bankvision.com"
                  required
                />
              </div>
            </FormField>
          </div>

          <div className="st-form-row">
            <FormField label="Phone Number" htmlFor="profile-phone" hint="Used for security alerts and 2FA codes" error={profileErrors.phone}>
              <div className="st-input-wrap">
                <Phone size={15} className="st-input-icon" />
                <input
                  id="profile-phone"
                  type="tel"
                  className="st-input"
                  value={profile.phone}
                  onChange={updateField('phone')}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </FormField>

            <FormField label="Role">
              <div className="st-input-wrap st-input-readonly">
                <Lock size={15} className="st-input-icon" />
                <input className="st-input" value={user?.role || ''} readOnly tabIndex={-1} />
              </div>
            </FormField>
          </div>

          <div className="st-form-footer">
            <StButton type="submit" icon={<Save size={15} />} loading={isSavingProfile}>
              Save Changes
            </StButton>
          </div>
        </form>
      </GlassCard>

      {/* ── Change Password ── */}
      <GlassCard
        title="Change Password"
        subtitle={settings?.two_factor_enabled ? 'Two-factor authentication is currently enabled' : 'Use 8+ characters mixing letters, numbers & symbols'}
        icon={<KeyRound size={17} />}
      >
        <form onSubmit={handleSavePassword} className="st-form">
          <div className="st-form-row">
            <FormField label="Current Password" htmlFor="pwd-current" error={passwordErrors.current_password}>
              <div className="st-input-wrap">
                <Lock size={15} className="st-input-icon" />
                <input
                  id="pwd-current"
                  type={showPasswords ? 'text' : 'password'}
                  className="st-input"
                  value={passwordForm.current_password}
                  onChange={(e) => {
                    setPasswordForm((p) => ({ ...p, current_password: e.target.value }))
                    setPasswordErrors((p) => ({ ...p, current_password: '' }))
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </FormField>
          </div>

          <div className="st-form-row">
            <FormField label="New Password" htmlFor="pwd-new" error={passwordErrors.password}>
              <div className="st-input-wrap">
                <Lock size={15} className="st-input-icon" />
                <input
                  id="pwd-new"
                  type={showPasswords ? 'text' : 'password'}
                  className="st-input"
                  value={passwordForm.password}
                  onChange={(e) => {
                    setPasswordForm((p) => ({ ...p, password: e.target.value }))
                    setPasswordErrors((p) => ({ ...p, password: '' }))
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </FormField>

            <FormField label="Confirm New Password" htmlFor="pwd-confirm" error={passwordErrors.password_confirmation}>
              <div className="st-input-wrap">
                <Lock size={15} className="st-input-icon" />
                <input
                  id="pwd-confirm"
                  type={showPasswords ? 'text' : 'password'}
                  className="st-input"
                  value={passwordForm.password_confirmation}
                  onChange={(e) => {
                    setPasswordForm((p) => ({ ...p, password_confirmation: e.target.value }))
                    setPasswordErrors((p) => ({ ...p, password_confirmation: '' }))
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </FormField>
          </div>

          <div className="st-form-footer">
            <button
              type="button"
              className="st-inline-link"
              onClick={() => setShowPasswords((s) => !s)}
            >
              {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
            <StButton type="submit" icon={<KeyRound size={15} />} loading={isSavingPassword}>
              Update Password
            </StButton>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
