export interface GradeRequest {
  score: number
  feedback?: string
}

export interface GradeResponse {
  id: string
  submissionId: string
  score: number
  feedback?: string
  gradedBy: string
  gradedAt: string
}
