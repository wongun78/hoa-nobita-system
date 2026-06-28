import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { CreateClassRequest, UpdateClassRequest } from './types'

export function useClasses() {
  return useQuery({ queryKey: qk.classes, queryFn: api.listClasses })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateClassRequest) => api.createClass(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classes }),
  })
}

export function useClass(id: string) {
  return useQuery({ queryKey: qk.class(id), queryFn: () => api.getClass(id), enabled: !!id })
}

export function useUpdateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateClassRequest }) => api.updateClass(id, req),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.class(id) })
      qc.invalidateQueries({ queryKey: qk.classes })
    },
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteClass(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.classes }),
  })
}

export function useAddClassAdmin(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: { userId: string }) => api.addAdmin(classId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.class(classId) }),
  })
}

export function useRemoveClassAdmin(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (adminId: string) => api.removeAdmin(classId, adminId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.class(classId) }),
  })
}

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: [...qk.class(classId), 'students'],
    queryFn: () => api.listStudents(classId),
    enabled: !!classId,
  })
}

export function useAddClassStudent(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: { userId: string }) => api.addStudent(classId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk.class(classId), 'students'] }),
  })
}

export function useRemoveClassStudent(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) => api.removeStudent(classId, studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk.class(classId), 'students'] }),
  })
}

export function useUpdateClassStudentStatus(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: 'ACTIVE' | 'PAUSED' | 'REMOVED' }) => api.updateStudentStatus(classId, studentId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...qk.class(classId), 'students'] }),
  })
}
