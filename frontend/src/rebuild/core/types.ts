export type RoleName = 'TEACHER_OWNER' | 'CLASS_ADMIN' | 'STUDENT'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type ClassStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type LessonStatus = 'DRAFT' | 'PUBLISHED'
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT_REQUESTED'
export type TargetType = 'CLASS' | 'USER' | 'ALL'
export type MemberStatus = 'ACTIVE' | 'PAUSED' | 'REMOVED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type ApiError = { field?: string; message: string }
export type ApiEnvelope<T> = { success: boolean; message: string; data: T; errors?: ApiError[] | null }
export type PageResponse<T> = { items: T[]; page: number; size: number; totalItems: number; totalPages: number }
export type QueryParams = Record<string, string | number | boolean | undefined | null>

export type AuthUser = {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
  status?: UserStatus
  roles: RoleName[]
  firstLogin: boolean
}

export type UserItem = AuthUser & {
  note?: string | null
  createdAt: string
  temporaryPassword?: string | null
}

export type ClassItem = {
  id: string
  name: string
  code: string
  description?: string | null
  levelFrom?: number | null
  levelTo?: number | null
  status: ClassStatus
  teacherId: string
  teacherName: string
  startDate?: string | null
  endDate?: string | null
  studentCount: number
  admins: Array<{ id: string; fullName: string }>
  createdAt: string
}

export type StudentMemberItem = {
  id: string
  fullName: string
  email?: string | null
  studentCode?: string | null
  status: MemberStatus
  joinedAt: string
}

export type LessonItem = {
  id: string
  classId: string
  title: string
  description?: string | null
  lessonDate?: string | null
  orderIndex: number
  status: LessonStatus
  createdAt: string
}

export type MaterialItem = {
  id: string
  classId: string
  lessonId?: string | null
  fileId?: string | null
  title: string
  description?: string | null
  externalUrl?: string | null
  visible: boolean
  createdAt: string
}

export type AssignmentItem = {
  id: string
  classId: string
  className?: string | null
  lessonId?: string | null
  title: string
  description?: string | null
  instruction?: string | null
  dueAt?: string | null
  maxScore: number
  status: AssignmentStatus
  allowResubmit: boolean
  skill?: string | null
  fileId?: string | null
  fileIds?: string[] | null
  externalLink?: string | null
  createdAt?: string | null
}

export type SubmissionItem = {
  id: string
  assignmentId: string
  assignmentTitle: string
  className: string
  studentId: string
  studentName: string
  contentText?: string | null
  contentUrl?: string | null
  fileId?: string | null
  fileIds?: string[] | null
  status: SubmissionStatus
  submittedAt: string
  gradeId?: string | null
  score?: number | null
  maxScore?: number | null
  feedback?: string | null
  // Submission file metadata
  fileName?: string | null
  fileContentType?: string | null
  fileSize?: number | null
  fileMetas?: Array<{ fileId: string; fileName?: string | null; contentType?: string | null; fileSize?: number | null }> | null
  // Feedback attachments
  feedbackFileId?: string | null
  feedbackLink?: string | null
  feedbackFileName?: string | null
  feedbackFileContentType?: string | null
  feedbackFileSize?: number | null
}

export type GradeItem = { id: string; submissionId: string; score: number; feedback?: string | null; gradedBy: string; gradedAt: string }

export type NotificationItem = {
  id: string
  title: string
  content: string
  targetType: TargetType
  targetId?: string | null
  createdBy: string
  createdAt: string
  isRead: boolean
  readAt?: string | null
}

export type ActivityItem = {
  id: string
  actionType: string
  targetType: string
  targetId?: string | null
  targetName?: string | null
  actorId: string
  actorName: string
  classId?: string | null
  message: string
  createdAt: string
}

export type FileItem = { id: string; originalFileName: string; contentType: string; fileSize: number; createdAt?: string; createdBy?: string }
export type AttendanceItem = { id: string; lessonId: string; studentId: string; studentName?: string; status: AttendanceStatus; note?: string | null; createdAt?: string }
export type CalendarEvent = { type: 'LESSON' | 'ASSIGNMENT_DEADLINE'; id: string; title: string; date?: string; dueAt?: string; classId: string; className: string }
