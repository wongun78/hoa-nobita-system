import { api } from '../../lib/api'
import type { ClassItem, CreateClassRequest, UpdateClassRequest, AddMemberRequest, ClassStats, BulkAddStudentsResult } from './types'

export async function listClasses(): Promise<ClassItem[]> {
  const res = await api.get('/classes')
  return res.data.data
}

export async function createClass(req: CreateClassRequest): Promise<ClassItem> {
  const res = await api.post('/classes', req)
  return res.data.data
}

export async function getClass(id: string): Promise<ClassItem> {
  const res = await api.get(`/classes/${id}`)
  return res.data.data
}

export async function updateClass(id: string, req: UpdateClassRequest): Promise<ClassItem> {
  const res = await api.patch(`/classes/${id}`, req)
  return res.data.data
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`)
}

export async function addAdmin(classId: string, req: AddMemberRequest): Promise<void> {
  await api.post(`/classes/${classId}/admins`, req)
}

export async function removeAdmin(classId: string, adminId: string): Promise<void> {
  await api.delete(`/classes/${classId}/admins/${adminId}`)
}

export async function listStudents(classId: string): Promise<any[]> {
  const res = await api.get(`/classes/${classId}/students`)
  return res.data.data
}

export async function addStudent(classId: string, req: AddMemberRequest): Promise<void> {
  await api.post(`/classes/${classId}/students`, req)
}

export async function addStudentsBulk(classId: string, studentIds: string[]): Promise<BulkAddStudentsResult> {
  const res = await api.post(`/classes/${classId}/students/bulk`, studentIds)
  return res.data.data
}

export async function removeStudent(classId: string, studentId: string): Promise<void> {
  await api.delete(`/classes/${classId}/students/${studentId}`)
}

export async function updateStudentStatus(classId: string, studentId: string, status: 'ACTIVE' | 'PAUSED' | 'REMOVED'): Promise<void> {
  await api.patch(`/classes/${classId}/students/${studentId}/status`, { status })
}

export async function getClassStats(classId: string): Promise<ClassStats> {
  const res = await api.get(`/classes/${classId}/stats`)
  return res.data.data
}
