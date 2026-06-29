export interface Submission {
  id: string
  assignmentId: string
  assignmentTitle?: string
  className?: string
  studentId: string
  studentName?: string
  contentText?: string
  contentUrl?: string
  fileId?: string
  status: 'SUBMITTED' | 'GRADED' | 'RESUBMIT_REQUESTED' | 'LATE'
  gradeId?: string
  score?: number
  maxScore?: number
  feedback?: string
  submittedAt: string
}

export interface SubmissionRequest {
  contentText?: string
  contentUrl?: string
  fileId?: string
}
