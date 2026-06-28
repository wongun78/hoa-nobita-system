import { api } from '../../lib/api'
import type { GradeRequest, GradeResponse } from './types'
import type { Submission } from '../submissions/types'

export async function classSubmissions(classId: string): Promise<Submission[]> {
  const res = await api.get(`/classes/${classId}/grading/submissions`)
  return res.data.data
}

export async function gradeSubmission(submissionId: string, req: GradeRequest): Promise<GradeResponse> {
  const res = await api.post(`/submissions/${submissionId}/grade`, req)
  return res.data.data
}

export async function updateGrade(gradeId: string, req: GradeRequest): Promise<GradeResponse> {
  const res = await api.patch(`/grades/${gradeId}`, req)
  return res.data.data
}

export async function requestResubmit(submissionId: string): Promise<void> {
  await api.post(`/submissions/${submissionId}/request-resubmit`)
}
