export type TargetType = 'ALL' | 'CLASS' | 'USER'

export interface Notification {
  id: string
  title: string
  content: string
  targetType: TargetType
  targetId?: string
  createdBy: string
  createdAt: string
  isRead: boolean
  readAt?: string
}

export interface NotificationRequest {
  title: string
  content: string
  targetType: TargetType
  targetId?: string
}
