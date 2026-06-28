import { api } from '../../lib/api';
import type { TeacherDashboardResponse, AdminDashboardResponse, StudentDashboardResponse } from './types';

export async function getTeacherDashboard(): Promise<TeacherDashboardResponse> {
  const res = await api.get('/dashboard/teacher');
  return res.data.data;
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const res = await api.get('/dashboard/admin');
  return res.data.data;
}

export async function getStudentDashboard(): Promise<StudentDashboardResponse> {
  const res = await api.get('/dashboard/student');
  return res.data.data;
}
