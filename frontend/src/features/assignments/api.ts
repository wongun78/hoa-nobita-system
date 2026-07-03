import { api } from '../../lib/api'
import type { Assignment, AssignmentReminderDispatch, AssignmentReminderPreview, AssignmentReminderRequest, AssignmentRequest, BatchAssignmentReminderDispatch, BatchAssignmentReminderRequest } from './types'

export async function listAssignments(classId?: string): Promise<Assignment[]> {
  const path = classId ? `/classes/${classId}/assignments` : '/assignments'
  const res = await api.get(path)
  return res.data.data
}

export async function createAssignment(classId: string, req: AssignmentRequest): Promise<Assignment> {
  const res = await api.post(`/classes/${classId}/assignments`, req)
  return res.data.data
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await api.get(`/assignments/${id}`)
  return res.data.data
}

export async function updateAssignment(id: string, req: AssignmentRequest): Promise<Assignment> {
  const res = await api.patch(`/assignments/${id}`, req)
  return res.data.data
}

export async function publishAssignment(id: string): Promise<Assignment> {
  const res = await api.patch(`/assignments/${id}/publish`)
  return res.data.data
}

export async function closeAssignment(id: string): Promise<Assignment> {
  const res = await api.patch(`/assignments/${id}/close`)
  return res.data.data
}

export async function copyAssignment(id: string): Promise<Assignment> {
  const res = await api.post(`/assignments/${id}/copy`)
  return res.data.data
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`)
}

export async function previewMissingStudents(id: string): Promise<AssignmentReminderPreview> {
  const res = await api.get(`/assignments/${id}/missing-students`)
  return res.data.data
}

export async function sendAssignmentReminder(id: string, req?: AssignmentReminderRequest): Promise<AssignmentReminderDispatch> {
  const res = await api.post(`/assignments/${id}/send-reminder`, req ?? {})
  return res.data.data
}

export async function sendBatchAssignmentReminders(classId: string, req?: BatchAssignmentReminderRequest): Promise<BatchAssignmentReminderDispatch> {
  const res = await api.post(`/classes/${classId}/assignments/send-reminders`, req ?? {})
  return res.data.data
}
