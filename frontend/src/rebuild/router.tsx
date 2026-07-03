import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './auth/guards'
import { AppShell } from './layout/app-shell'
import { AssignmentsPage } from './pages/assignments-page'
import { ChangePasswordPage } from './pages/change-password-page'
import { ClassDetailPage } from './pages/class-detail-page'
import { ClassesPage } from './pages/classes-page'
import { DashboardPage } from './pages/dashboard-page'
import { LoginPage } from './pages/login-page'
import { NotificationsPage } from './pages/notifications-page'
import { ReportsPage } from './pages/reports-page'
import { ForbiddenPage, NotFoundPage } from './pages/simple-pages'
import { UsersPage } from './pages/users-page'
import { AttendancePage, CalendarPage, GradingPage, MaterialsPage, ProfilePage, StudentAssignmentSubmitPage, StudentSubmissionsPage } from './pages/operations-pages'

function AppFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  )
}

export function NewAppRouter() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />

      <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
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

      <Route path="/bang-dieu-khien" element={<AppFrame><DashboardPage /></AppFrame>} />
      <Route path="/lop-hoc" element={<AppFrame><ClassesPage /></AppFrame>} />
      <Route path="/lop-hoc/:classId" element={<AppFrame><ClassDetailPage /></AppFrame>} />
      <Route path="/bai-tap" element={<AppFrame><AssignmentsPage /></AppFrame>} />
      <Route path="/tai-lieu" element={<AppFrame><MaterialsPage /></AppFrame>} />
      <Route path="/thong-bao" element={<AppFrame><NotificationsPage /></AppFrame>} />
      <Route path="/diem-danh" element={<AppFrame><AttendancePage /></AppFrame>} />
      <Route path="/lich-hoc" element={<AppFrame><CalendarPage /></AppFrame>} />
      <Route path="/ho-so" element={<AppFrame><ProfilePage /></AppFrame>} />
      <Route path="/doi-mat-khau" element={<AppFrame><ChangePasswordPage /></AppFrame>} />
      <Route path="/student/submissions" element={<AppFrame><StudentSubmissionsPage /></AppFrame>} />
      <Route path="/student/submit" element={<AppFrame><StudentAssignmentSubmitPage /></AppFrame>} />

      <Route path="/nguoi-dung" element={<RequireRole roles={['TEACHER_OWNER']}><AppShell><UsersPage /></AppShell></RequireRole>} />
      <Route path="/bao-cao" element={<RequireRole roles={['TEACHER_OWNER', 'CLASS_ADMIN']}><AppShell><ReportsPage /></AppShell></RequireRole>} />
      <Route path="/cham-bai" element={<RequireRole roles={['TEACHER_OWNER', 'CLASS_ADMIN']}><AppShell><GradingPage /></AppShell></RequireRole>} />

      <Route path="/khong-co-quyen" element={<ForbiddenPage />} />
      <Route path="/" element={<Navigate to="/bang-dieu-khien" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
