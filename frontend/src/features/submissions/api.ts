import { api } from '../../lib/api'
import type { Submission, SubmissionRequest } from './types'

export async function listSubmissions(assignmentId: string): Promise<Submission[]> {
  const res = await api.get(`/assignments/${assignmentId}/submissions`)
  return res.data.data
}

export async function submit(assignmentId: string, req: SubmissionRequest): Promise<Submission> {
  const res = await api.post(`/assignments/${assignmentId}/submissions`, req)
  return res.data.data
}

export async function getSubmission(id: string): Promise<Submission> {
  const res = await api.get(`/submissions/${id}`)
  return res.data.data
}

export async function updateSubmission(id: string, req: SubmissionRequest): Promise<Submission> {
  const res = await api.patch(`/submissions/${id}`, req)
  return res.data.data
}

export async function deleteSubmission(id: string): Promise<void> {
  await api.delete(`/submissions/${id}`)
}

export async function mySubmissions(): Promise<Submission[]> {
  const res = await api.get('/me/submissions')
  return res.data.data
}
