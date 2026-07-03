import { api } from '../../lib/api'
import type { Notification, NotificationRequest } from './types'

export async function listNotifications(): Promise<Notification[]> {
  const res = await api.get('/notifications')
  return res.data.data
}

export async function createNotification(req: NotificationRequest): Promise<Notification> {
  const res = await api.post('/notifications', req)
  return res.data.data
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await api.post(`/notifications/${id}/read`)
  return res.data.data
}
