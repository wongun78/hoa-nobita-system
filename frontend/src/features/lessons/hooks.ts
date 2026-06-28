import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { LessonRequest } from './types'

export function useLessons(classId: string) {
  return useQuery({ queryKey: qk.lessons(classId), queryFn: () => api.listLessons(classId), enabled: !!classId })
}

export function useCreateLesson(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: LessonRequest) => api.createLesson(classId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.lessons(classId) }),
  })
}

export function useUpdateLesson(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: LessonRequest }) => api.updateLesson(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.lessons(classId) }),
  })
}

export function useDeleteLesson(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteLesson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.lessons(classId) }),
  })
}
