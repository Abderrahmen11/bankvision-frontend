import { apiClient } from './client'
import type { ApiResponse } from '@/shared/types/api'

interface AppNotification {
  id: number
  type: 'info' | 'warning' | 'success' | 'danger'
  title: string
  message: string | null
  link: string | null
  read_at: string | null
  created_at: string | null
}

export interface NotificationsPayload {
  notifications: AppNotification[]
  unread_count: number
}

/**
 * In-app notifications API (bell icon) — real records from the notifications table.
 */
export const notificationsApi = {
  list: async (limit = 15): Promise<NotificationsPayload> => {
    const res = await apiClient.get<ApiResponse<NotificationsPayload>>('/notifications', {
      params: { limit },
    })
    return res.data.data
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all')
  },
}
