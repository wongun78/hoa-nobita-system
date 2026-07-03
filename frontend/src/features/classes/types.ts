export interface ClassItem {
  id: string
  name: string
  code: string
  description?: string
  levelFrom: number
  levelTo: number
  status: 'ACTIVE' | 'ARCHIVED'
  ownerId?: string
  startDate?: string
  endDate?: string
  admins?: { id: string; fullName: string }[]
}

export interface CreateClassRequest {
  name: string
  code: string
  description?: string
  levelFrom: number
  levelTo: number
  status?: 'ACTIVE' | 'ARCHIVED'
}

export interface UpdateClassRequest {
  name?: string
  code?: string
  description?: string
  levelFrom?: number
  levelTo?: number
  status?: 'ACTIVE' | 'ARCHIVED'
  startDate?: string
  endDate?: string
}

export interface AddMemberRequest { userId: string }

export interface StudentMemberResponse {
  id: string
  fullName: string
  email?: string
  status: 'ACTIVE' | 'PAUSED' | 'REMOVED'
  joinedAt: string
}

export interface BulkAddStudentsResult {
  added: number
  reactivated: number
  skipped: number
  errors: string[]
}

export interface ClassStats {
  classId: string
  totalStudents: number
  totalAssignments: number
  totalSubmissions: number
  missingSubmissions: number
  lateSubmissions: number
  gradedSubmissions: number
  needGrading: number
  submissionRate: number
  averageScore: number
}
