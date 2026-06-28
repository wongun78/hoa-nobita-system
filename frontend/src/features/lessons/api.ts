import { api } from '../../lib/api'
import type { Lesson, LessonRequest } from './types'

export async function listLessons(classId: string): Promise<Lesson[]> {
  const res = await api.get(`/classes/${classId}/lessons`)
  return res.data.data
}

export async function createLesson(classId: string, req: LessonRequest): Promise<Lesson> {
  const res = await api.post(`/classes/${classId}/lessons`, req)
  return res.data.data
}

export async function getLesson(id: string): Promise<Lesson> {
  const res = await api.get(`/lessons/${id}`)
  return res.data.data
}

export async function updateLesson(id: string, req: LessonRequest): Promise<Lesson> {
  const res = await api.patch(`/lessons/${id}`, req)
  return res.data.data
}

export async function deleteLesson(id: string): Promise<void> {
  await api.delete(`/lessons/${id}`)
}
