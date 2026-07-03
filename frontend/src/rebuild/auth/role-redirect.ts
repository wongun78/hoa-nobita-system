import type { AuthUser, RoleName } from '../core/types'

export function dashboardPathForRole(role: RoleName): string {
  if (role === 'TEACHER_OWNER') return '/teacher/dashboard'
  if (role === 'CLASS_ADMIN') return '/admin/dashboard'
  return '/student/home'
}

export function homePathForUser(user: Pick<AuthUser, 'roles'> | null | undefined): string {
  const roles = user?.roles ?? []
  if (roles.includes('TEACHER_OWNER')) return dashboardPathForRole('TEACHER_OWNER')
  if (roles.includes('CLASS_ADMIN')) return dashboardPathForRole('CLASS_ADMIN')
  return dashboardPathForRole('STUDENT')
}
