import { api } from '../../lib/api'
import type { Material, MaterialRequest } from './types'

export async function listMaterials(classId: string): Promise<Material[]> {
  const res = await api.get(`/classes/${classId}/materials`)
  return res.data.data
}

export async function createMaterial(classId: string, req: MaterialRequest): Promise<Material> {
  const res = await api.post(`/classes/${classId}/materials`, req)
  return res.data.data
}

export async function getMaterial(id: string): Promise<Material> {
  const res = await api.get(`/materials/${id}`)
  return res.data.data
}

export async function updateMaterial(id: string, req: MaterialRequest): Promise<Material> {
  const res = await api.patch(`/materials/${id}`, req)
  return res.data.data
}

export async function deleteMaterial(id: string): Promise<void> {
  await api.delete(`/materials/${id}`)
}

export async function updateVisibility(id: string, visible: boolean): Promise<Material> {
  const res = await api.patch(`/materials/${id}/visibility`, { visible })
  return res.data.data
}
