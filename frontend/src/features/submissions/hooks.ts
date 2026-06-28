import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { SubmissionRequest } from './types'

export function useSubmissions(assignmentId: string) {
  return useQuery({ queryKey: qk.submissions(assignmentId), queryFn: () => api.listSubmissions(assignmentId), enabled: !!assignmentId })
}

export function useSubmit(assignmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: SubmissionRequest) => api.submit(assignmentId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.submissions(assignmentId) }),
  })
}

export function useSubmission(id: string) {
  return useQuery({ queryKey: qk.submission(id), queryFn: () => api.getSubmission(id), enabled: !!id })
}

export function useUpdateSubmission(_assignmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: SubmissionRequest }) => api.updateSubmission(id, req),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: qk.submission(id) }),
  })
}

export function useDeleteSubmission(assignmentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteSubmission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.submissions(assignmentId) }),
  })
}

export function useMySubmissions() {
  return useQuery({ queryKey: qk.mySubmissions, queryFn: api.mySubmissions })
}
