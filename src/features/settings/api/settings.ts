import { apiClient } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/types/api'
import type { User } from '@/shared/types/user'
import type {
  ActiveSession,
  ApiToken,
  ApiTokenListResponse,
  AvatarUploadResponse,
  CreateApiTokenResponse,
  LoginHistoryResponse,
  NotificationSettings,
  SystemHealth,
  SystemSettings,
  TwoFactorChannel,
  UpdatePasswordPayload,
  UpdateProfilePayload,
  UserPreferences,
  UserSettings,
} from '@/features/settings/types'

/**
 * Settings API Service — profile, security, notifications, preferences, system
 */
export const settingsApi = {
  // ── Settings index ────────────────────────────────────────────────────────

  getAll: async (): Promise<UserSettings> => {
    const res = await apiClient.get<ApiResponse<UserSettings>>('/settings')
    return res.data.data
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>('/settings/profile', payload)
    return res.data.data
  },

  updatePassword: async (payload: UpdatePasswordPayload): Promise<void> => {
    await apiClient.put('/settings/profile/password', payload)
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await apiClient.post<ApiResponse<AvatarUploadResponse>>(
      '/settings/profile/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data.data
  },

  removeAvatar: async (): Promise<void> => {
    await apiClient.delete('/settings/profile/avatar')
  },

  // ── Notifications & Preferences ───────────────────────────────────────────

  updateNotifications: async (payload: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const res = await apiClient.put<ApiResponse<NotificationSettings>>('/settings/notifications', payload)
    return res.data.data
  },

  updatePreferences: async (payload: Partial<UserPreferences>): Promise<UserPreferences> => {
    const res = await apiClient.put<ApiResponse<UserPreferences>>('/settings/preferences', payload)
    return res.data.data
  },

  // ── Security ──────────────────────────────────────────────────────────────

  setTwoFactor: async (enabled: boolean, channel?: TwoFactorChannel): Promise<{ two_factor_enabled: boolean; two_factor_channel: TwoFactorChannel | null }> => {
    const res = await apiClient.post<ApiResponse<{ two_factor_enabled: boolean; two_factor_channel: TwoFactorChannel | null }>>(
      '/settings/security/2fa',
      { enabled, channel }
    )
    return res.data.data
  },

  // Real email-OTP enable flow: request a code, then confirm it
  sendTwoFactorCode: async (channel: TwoFactorChannel = 'email'): Promise<void> => {
    await apiClient.post('/settings/security/2fa/send-code', { channel })
  },

  verifyTwoFactorCode: async (code: string): Promise<{ two_factor_enabled: boolean; two_factor_channel: TwoFactorChannel | null }> => {
    const res = await apiClient.post<ApiResponse<{ two_factor_enabled: boolean; two_factor_channel: TwoFactorChannel | null }>>(
      '/settings/security/2fa/verify',
      { code }
    )
    return res.data.data
  },

  getSessions: async (): Promise<ActiveSession[]> => {
    const res = await apiClient.get<ApiResponse<ActiveSession[]>>('/settings/security/sessions')
    return res.data.data
  },

  revokeSession: async (id: number): Promise<void> => {
    await apiClient.delete(`/settings/security/sessions/${id}`)
  },

  revokeAllSessions: async (): Promise<number> => {
    const res = await apiClient.post<ApiResponse<{ revoked: number }>>('/settings/security/sessions/revoke-all')
    return res.data.data.revoked
  },

  getLoginHistory: async (page = 1, perPage = 15): Promise<LoginHistoryResponse> => {
    const res = await apiClient.get<ApiResponse<LoginHistoryResponse>>('/settings/security/login-history', {
      params: { page, per_page: perPage },
    })
    return res.data.data
  },

  // ── API tokens (admin) ────────────────────────────────────────────────────

  getTokens: async (perPage = 100): Promise<ApiTokenListResponse> => {
    const res = await apiClient.get<{ success: boolean; data: ApiToken[]; meta: ApiTokenListResponse['meta'] }>(
      '/settings/security/tokens',
      { params: { per_page: perPage } }
    )
    return { tokens: res.data.data, meta: res.data.meta }
  },

  createToken: async (name: string, abilities: string[] = ['*']): Promise<CreateApiTokenResponse> => {
    const res = await apiClient.post<ApiResponse<CreateApiTokenResponse>>('/settings/security/tokens', {
      name,
      abilities,
    })
    return res.data.data
  },

  revokeToken: async (id: number): Promise<void> => {
    await apiClient.delete(`/settings/security/tokens/${id}`)
  },

  // ── System configuration (admin) ──────────────────────────────────────────

  getSystemSettings: async (): Promise<SystemSettings> => {
    const res = await apiClient.get<ApiResponse<SystemSettings>>('/settings/system')
    return res.data.data
  },

  updateSystemSettings: async (payload: Partial<SystemSettings>): Promise<SystemSettings> => {
    const res = await apiClient.put<ApiResponse<SystemSettings>>('/settings/system', payload)
    return res.data.data
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<ApiResponse<SystemHealth>>('/settings/system/health')
    return res.data.data
  },
}
