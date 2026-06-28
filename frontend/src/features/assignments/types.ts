export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export interface Assignment {
  id: string
  classId: string
  className?: string
  lessonId?: string
  title: string
  description?: string
  instruction?: string
  maxScore: number
  status: AssignmentStatus
  allowResubmit: boolean
  dueAt?: string
  createdAt?: string
}

export interface AssignmentRequest {
  title: string
  description?: string
  instruction?: string
  maxScore: number
  status?: AssignmentStatus
  allowResubmit?: boolean
  dueAt?: string
}
