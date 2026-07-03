import { useNewAuth } from '../auth/use-auth'
import { AdminDashboardPage } from './admin-dashboard'
import { StudentDashboardPage } from './student-dashboard'
import { TeacherDashboardPage } from './teacher-dashboard'

export function DashboardPage() {
  const { user, hasRole } = useNewAuth()

  if (!user) return null
  if (hasRole('TEACHER_OWNER')) return <TeacherDashboardPage />
  if (hasRole('CLASS_ADMIN')) return <AdminDashboardPage />
  return <StudentDashboardPage />
}
