import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/query-keys'
import * as api from './api'
import type { MaterialRequest } from './types'

export function useMaterials(classId: string) {
  return useQuery({ queryKey: qk.materials(classId), queryFn: () => api.listMaterials(classId), enabled: !!classId })
}

export function useCreateMaterial(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: MaterialRequest) => api.createMaterial(classId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials(classId) }),
  })
}

export function useUpdateMaterial(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: MaterialRequest }) => api.updateMaterial(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials(classId) }),
  })
}

export function useDeleteMaterial(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteMaterial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials(classId) }),
  })
}

export function useUpdateVisibility(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => api.updateVisibility(id, visible),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.materials(classId) }),
  })
}
