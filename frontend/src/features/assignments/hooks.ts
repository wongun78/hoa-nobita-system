import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { AssignmentRequest } from './types'

export function useAssignments(classId?: string) {
  return useQuery({ queryKey: qk.assignments(classId), queryFn: () => api.listAssignments(classId) })
}

export function useCreateAssignment(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: AssignmentRequest) => api.createAssignment(classId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.assignments(classId) }),
  })
}

export function useAssignment(id: string) {
  return useQuery({ queryKey: qk.assignment(id), queryFn: () => api.getAssignment(id), enabled: !!id })
}

export function useUpdateAssignment(_classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: AssignmentRequest }) => api.updateAssignment(id, req),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.assignment(id) })
      qc.invalidateQueries({ queryKey: qk.assignments() })
    },
  })
}

export function usePublishAssignment(_classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.publishAssignment(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: qk.assignment(id) })
      qc.invalidateQueries({ queryKey: qk.assignments() })
    },
  })
}

export function useCloseAssignment(_classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.closeAssignment(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: qk.assignment(id) })
      qc.invalidateQueries({ queryKey: qk.assignments() })
    },
  })
}

export function useCopyAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.copyAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.assignments() }),
  })
}

export function useDeleteAssignment(_classId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAssignment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.assignments() }),
  })
}
