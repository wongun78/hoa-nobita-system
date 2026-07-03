import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './auth/guards'
import { AppShell } from './layout/app-shell'
import { AssignmentsPage } from './pages/assignments-page'
import { AssignmentsV2Page } from './pages/assignments-v2'
import { ChangePasswordPage } from './pages/change-password-page'
import { ClassDetailV2Page } from './pages/class-detail-v2'
import { ClassDetailPage } from './pages/class-detail-page'
import { ClassesPage } from './pages/classes-page'
import { DashboardPage } from './pages/dashboard-page'
import { GradingV2Page } from './pages/grading-v2'
import { LoginPage } from './pages/login-page'
import { NotificationsPage } from './pages/notifications-page'
import { AttendancePage, CalendarPage, MaterialsPage, ProfilePage, StudentAssignmentSubmitPage, StudentSubmissionsPage } from './pages/operations-pages'
import { ReportsPage } from './pages/reports-page'
import { ForbiddenPage, NotFoundPage } from './pages/simple-pages'
import { StudentClassDetailPage } from './pages/student-class-detail-page'
import { StudentClassesPage } from './pages/student-classes-page'
import { StudentHomePage } from './pages/student-home-page'
import { UserDetailPage, UsersPage } from './pages/users-page'
import type { RoleName } from './core/types'

function AppFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}

function RoleFrame({ roles, children }: Readonly<{ roles: RoleName[]; children: React.ReactNode }>) {
  return <RequireRole roles={roles}><AppShell>{children}</AppShell></RequireRole>
}

export function NewAppRouter() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />

      <Route path="/teacher/dashboard" element={<RoleFrame roles={['TEACHER_OWNER']}><DashboardPage /></RoleFrame>} />
      <Route path="/teacher/users" element={<RoleFrame roles={['TEACHER_OWNER']}><UsersPage /></RoleFrame>} />
      <Route path="/teacher/users/:id" element={<RoleFrame roles={['TEACHER_OWNER']}><UserDetailPage /></RoleFrame>} />
      <Route path="/teacher/classes" element={<RoleFrame roles={['TEACHER_OWNER']}><ClassesPage /></RoleFrame>} />
      <Route path="/teacher/classes/:classId" element={<RoleFrame roles={['TEACHER_OWNER']}><ClassDetailV2Page /></RoleFrame>} />
      <Route path="/teacher/assignments" element={<RoleFrame roles={['TEACHER_OWNER']}><AssignmentsV2Page /></RoleFrame>} />
      <Route path="/teacher/grading" element={<RoleFrame roles={['TEACHER_OWNER']}><GradingV2Page /></RoleFrame>} />
      <Route path="/teacher/materials" element={<RoleFrame roles={['TEACHER_OWNER']}><MaterialsPage /></RoleFrame>} />
      <Route path="/teacher/notifications" element={<RoleFrame roles={['TEACHER_OWNER']}><NotificationsPage /></RoleFrame>} />
      <Route path="/teacher/attendance" element={<RoleFrame roles={['TEACHER_OWNER']}><AttendancePage /></RoleFrame>} />
      <Route path="/teacher/calendar" element={<RoleFrame roles={['TEACHER_OWNER']}><CalendarPage /></RoleFrame>} />
      <Route path="/teacher/reports" element={<RoleFrame roles={['TEACHER_OWNER']}><ReportsPage /></RoleFrame>} />

      <Route path="/admin/dashboard" element={<RoleFrame roles={['CLASS_ADMIN']}><DashboardPage /></RoleFrame>} />
      <Route path="/admin/classes" element={<RoleFrame roles={['CLASS_ADMIN']}><ClassesPage /></RoleFrame>} />
      <Route path="/admin/classes/:classId" element={<RoleFrame roles={['CLASS_ADMIN']}><ClassDetailV2Page /></RoleFrame>} />
      <Route path="/admin/assignments" element={<RoleFrame roles={['CLASS_ADMIN']}><AssignmentsV2Page /></RoleFrame>} />
      <Route path="/admin/grading" element={<RoleFrame roles={['CLASS_ADMIN']}><GradingV2Page /></RoleFrame>} />
      <Route path="/admin/materials" element={<RoleFrame roles={['CLASS_ADMIN']}><MaterialsPage /></RoleFrame>} />
      <Route path="/admin/notifications" element={<RoleFrame roles={['CLASS_ADMIN']}><NotificationsPage /></RoleFrame>} />
      <Route path="/admin/attendance" element={<RoleFrame roles={['CLASS_ADMIN']}><AttendancePage /></RoleFrame>} />
      <Route path="/admin/calendar" element={<RoleFrame roles={['CLASS_ADMIN']}><CalendarPage /></RoleFrame>} />
      <Route path="/admin/reports" element={<RoleFrame roles={['CLASS_ADMIN']}><ReportsPage /></RoleFrame>} />

      <Route path="/student/home" element={<RoleFrame roles={['STUDENT']}><StudentHomePage /></RoleFrame>} />
      <Route path="/student/classes" element={<RoleFrame roles={['STUDENT']}><StudentClassesPage /></RoleFrame>} />
      <Route path="/student/classes/:classId" element={<RoleFrame roles={['STUDENT']}><StudentClassDetailPage /></RoleFrame>} />
      <Route path="/student/assignments" element={<RoleFrame roles={['STUDENT']}><AssignmentsPage /></RoleFrame>} />
      <Route path="/student/submissions" element={<RoleFrame roles={['STUDENT']}><StudentSubmissionsPage /></RoleFrame>} />
      <Route path="/student/materials" element={<RoleFrame roles={['STUDENT']}><MaterialsPage /></RoleFrame>} />
      <Route path="/student/attendance" element={<RoleFrame roles={['STUDENT']}><AttendancePage /></RoleFrame>} />
      <Route path="/student/calendar" element={<RoleFrame roles={['STUDENT']}><CalendarPage /></RoleFrame>} />
      <Route path="/student/notifications" element={<RoleFrame roles={['STUDENT']}><NotificationsPage /></RoleFrame>} />
      <Route path="/student/profile" element={<RoleFrame roles={['STUDENT']}><ProfilePage /></RoleFrame>} />
      <Route path="/student/submit" element={<RoleFrame roles={['STUDENT']}><StudentAssignmentSubmitPage /></RoleFrame>} />

      <Route path="/bang-dieu-khien" element={<AppFrame><DashboardPage /></AppFrame>} />
      <Route path="/lop-hoc" element={<AppFrame><ClassesPage /></AppFrame>} />
      <Route path="/lop-hoc/:classId" element={<AppFrame><ClassDetailPage /></AppFrame>} />
      <Route path="/bai-tap" element={<AppFrame><AssignmentsPage /></AppFrame>} />
      <Route path="/tai-lieu" element={<AppFrame><MaterialsPage /></AppFrame>} />
      <Route path="/thong-bao" element={<AppFrame><NotificationsPage /></AppFrame>} />
      <Route path="/diem-danh" element={<AppFrame><AttendancePage /></AppFrame>} />
      <Route path="/lich-hoc" element={<AppFrame><CalendarPage /></AppFrame>} />
      <Route path="/nguoi-dung" element={<RoleFrame roles={['TEACHER_OWNER']}><UsersPage /></RoleFrame>} />
      <Route path="/bao-cao" element={<RoleFrame roles={['TEACHER_OWNER', 'CLASS_ADMIN']}><ReportsPage /></RoleFrame>} />
      <Route path="/cham-bai" element={<RoleFrame roles={['TEACHER_OWNER', 'CLASS_ADMIN']}><GradingV2Page /></RoleFrame>} />
      <Route path="/ho-so" element={<AppFrame><ProfilePage /></AppFrame>} />
      <Route path="/doi-mat-khau" element={<AppFrame><ChangePasswordPage /></AppFrame>} />

      <Route path="/dashboard" element={<Navigate to="/bang-dieu-khien" replace />} />
      <Route path="/classes" element={<Navigate to="/lop-hoc" replace />} />
      <Route path="/assignments" element={<Navigate to="/bai-tap" replace />} />
      <Route path="/users" element={<Navigate to="/nguoi-dung" replace />} />
      <Route path="/notifications" element={<Navigate to="/thong-bao" replace />} />
      <Route path="/reports" element={<Navigate to="/bao-cao" replace />} />
      <Route path="/materials" element={<Navigate to="/tai-lieu" replace />} />
      <Route path="/grading" element={<Navigate to="/cham-bai" replace />} />
      <Route path="/attendance" element={<Navigate to="/diem-danh" replace />} />
      <Route path="/calendar" element={<Navigate to="/lich-hoc" replace />} />
      <Route path="/profile" element={<Navigate to="/ho-so" replace />} />

      <Route path="/khong-co-quyen" element={<ForbiddenPage />} />
      <Route path="/" element={<Navigate to="/bang-dieu-khien" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
