export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  contentText?: string
  contentUrl?: string
  fileId?: string
  status: 'SUBMITTED' | 'GRADED' | 'RESUBMIT_REQUESTED' | 'LATE'
  score?: number
  feedback?: string
  submittedAt: string
}

export interface SubmissionRequest {
  contentText?: string
  contentUrl?: string
  fileId?: string
}
