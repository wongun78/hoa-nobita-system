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
  skill?: string
  fileId?: string
  externalLink?: string
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
  skill?: string
  fileId?: string
  externalLink?: string
  dueAt?: string
}

export interface MissingStudent {
  studentId: string
  fullName: string
  email?: string
  phone?: string
}

export interface AssignmentReminderPreview {
  assignmentId: string
  assignmentTitle: string
  classId: string
  className: string
  deadline?: string
  totalStudents: number
  submittedCount: number
  missingCount: number
  missingStudents: MissingStudent[]
}

export interface AssignmentReminderRequest {
  title?: string
  content?: string
}

export interface AssignmentReminderDispatch {
  notificationId: string
  assignmentId: string
  recipientCount: number
  title: string
  content: string
  createdAt: string
}

export interface BatchAssignmentReminderRequest {
  assignmentIds?: string[]
  title?: string
  content?: string
}

export interface BatchAssignmentReminderDispatch {
  assignmentCount: number
  totalRecipients: number
  dispatches: AssignmentReminderDispatch[]
}
