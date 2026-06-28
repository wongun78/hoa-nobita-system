import { useQuery } from '@tanstack/react-query';
import { getTeacherDashboard, getAdminDashboard, getStudentDashboard } from './api';
import type { TeacherDashboardResponse, AdminDashboardResponse, StudentDashboardResponse } from './types';

export function useTeacherDashboard() {
  return useQuery<TeacherDashboardResponse>({
    queryKey: ['dashboard', 'teacher'],
    queryFn: getTeacherDashboard,
    staleTime: 60_000,
  });
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardResponse>({
    queryKey: ['dashboard', 'admin'],
    queryFn: getAdminDashboard,
    staleTime: 60_000,
  });
}

export function useStudentDashboard() {
  return useQuery<StudentDashboardResponse>({
    queryKey: ['dashboard', 'student'],
    queryFn: getStudentDashboard,
    staleTime: 60_000,
  });
}
