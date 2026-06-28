export type TargetType = 'ALL' | 'CLASS' | 'ROLE'

export interface Notification {
  id: string
  title: string
  content: string
  targetType: TargetType
  targetId?: string
  createdAt: string
}

export interface NotificationRequest {
  title: string
  content: string
  targetType: TargetType
  targetId?: string
}
