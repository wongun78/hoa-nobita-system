import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { GradeRequest } from './types'

export function useGradingQueue(classId: string) {
  return useQuery({ queryKey: qk.gradingQueue(classId), queryFn: () => api.classSubmissions(classId), enabled: !!classId })
}

export function useGradeSubmission(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, req }: { submissionId: string; req: GradeRequest }) => api.gradeSubmission(submissionId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.gradingQueue(classId) }),
  })
}

export function useRequestResubmit(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (submissionId: string) => api.requestResubmit(submissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.gradingQueue(classId) }),
  })
}
