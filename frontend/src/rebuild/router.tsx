import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole } from './auth/guards'
import { ErrorBoundary } from './components/error-boundary'
import { SkeletonCard } from './components/foundation'
import { AppShell } from './layout/app-shell'
import { AttendanceMarkingPage } from './pages/attendance-marking-page'
import { ChangePasswordPage } from './pages/change-password-page'
import { ClassesPage } from './pages/classes-page'
import { LoginPage } from './pages/login-page'
import { MaterialsLibraryPage } from './pages/materials-library-page'
import { NotificationsInboxPage } from './pages/notifications-inbox-page'
import { AttendancePage, MaterialsPage, StudentAssignmentSubmitPage } from './pages/operations-pages'
import { ForbiddenPage, NotFoundPage } from './pages/simple-pages'
import { StudentAssignmentDetailPage } from './pages/student-assignment-detail-page'
import { StudentAssignmentsPage } from './pages/student-assignments-page'
import { StudentAttendancePage } from './pages/student-attendance-page'
import { StudentClassDetailPage } from './pages/student-class-detail-page'
import { StudentClassesPage } from './pages/student-classes-page'
import { StudentGradesPage } from './pages/student-grades-page'
import { StudentHomePage } from './pages/student-home-page'
import { StudentSubmissionsPage } from './pages/student-submissions-page'
import { UserDetailPage, UsersPage } from './pages/users-page'
import type { RoleName } from './core/types'

function lazyWithRetry<T extends React.ComponentType>(factory: () => Promise<{ default: T }>, retries = 3, interval = 1500): React.LazyExoticComponent<T> {
  return lazy(() => {
    let lastError: unknown
    const attempt = async (): Promise<{ default: T }> => {
      for (let i = 0; i <= retries; i++) {
        try {
          return await factory()
        } catch (err) {
          lastError = err
          if (i < retries) await new Promise((r) => setTimeout(r, interval * (i + 1)))
        }
      }
      throw lastError
    }
    return attempt()
  })
}

const AssignmentsV2Page = lazyWithRetry(() => import('./pages/assignments-v2').then((module) => ({ default: module.AssignmentsV2Page })))
const CalendarPage = lazyWithRetry(() => import('./pages/calendar-page').then((module) => ({ default: module.CalendarPage })))
const ClassDetailV2Page = lazyWithRetry(() => import('./pages/class-detail-v2').then((module) => ({ default: module.ClassDetailV2Page })))
const DashboardPage = lazyWithRetry(() => import('./pages/dashboard-page').then((module) => ({ default: module.DashboardPage })))
const GradingV2Page = lazyWithRetry(() => import('./pages/grading-v2').then((module) => ({ default: module.GradingV2Page })))

function RouteFallback() {
  return <div className="space-y-4"><SkeletonCard lines={4} /><SkeletonCard lines={3} /></div>
}

function LazyPage({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

function AppFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth>
      <AppShell><ErrorBoundary>{children}</ErrorBoundary></AppShell>
    </RequireAuth>
  )
}

function RoleFrame({ roles, children }: Readonly<{ roles: RoleName[]; children: React.ReactNode }>) {
  return <RequireRole roles={roles}><AppShell><ErrorBoundary>{children}</ErrorBoundary></AppShell></RequireRole>
}

function RoleLazyPage({ roles, children }: Readonly<{ roles: RoleName[]; children: React.ReactNode }>) {
  return <RoleFrame roles={roles}><LazyPage>{children}</LazyPage></RoleFrame>
}

function AppLazyPage({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppFrame><LazyPage>{children}</LazyPage></AppFrame>
}

export function NewAppRouter() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />

      <Route path="/teacher/dashboard" element={<RoleLazyPage roles={['TEACHER_OWNER']}><DashboardPage /></RoleLazyPage>} />
      <Route path="/teacher/users" element={<RoleFrame roles={['TEACHER_OWNER']}><UsersPage /></RoleFrame>} />
      <Route path="/teacher/users/:id" element={<RoleFrame roles={['TEACHER_OWNER']}><UserDetailPage /></RoleFrame>} />
      <Route path="/teacher/classes" element={<RoleFrame roles={['TEACHER_OWNER']}><ClassesPage /></RoleFrame>} />
      <Route path="/teacher/classes/:classId" element={<RoleLazyPage roles={['TEACHER_OWNER']}><ClassDetailV2Page /></RoleLazyPage>} />
      <Route path="/teacher/assignments" element={<RoleLazyPage roles={['TEACHER_OWNER']}><AssignmentsV2Page /></RoleLazyPage>} />
      <Route path="/teacher/grading" element={<RoleLazyPage roles={['TEACHER_OWNER']}><GradingV2Page /></RoleLazyPage>} />
      <Route path="/teacher/materials" element={<RoleFrame roles={['TEACHER_OWNER']}><MaterialsLibraryPage /></RoleFrame>} />
      <Route path="/teacher/notifications" element={<RoleFrame roles={['TEACHER_OWNER']}><NotificationsInboxPage /></RoleFrame>} />
      <Route path="/teacher/attendance" element={<RoleFrame roles={['TEACHER_OWNER']}><AttendanceMarkingPage /></RoleFrame>} />
      <Route path="/teacher/calendar" element={<RoleLazyPage roles={['TEACHER_OWNER']}><CalendarPage /></RoleLazyPage>} />

      <Route path="/admin/dashboard" element={<RoleLazyPage roles={['CLASS_ADMIN']}><DashboardPage /></RoleLazyPage>} />
      <Route path="/admin/classes" element={<RoleFrame roles={['CLASS_ADMIN']}><ClassesPage /></RoleFrame>} />
      <Route path="/admin/classes/:classId" element={<RoleLazyPage roles={['CLASS_ADMIN']}><ClassDetailV2Page /></RoleLazyPage>} />
      <Route path="/admin/assignments" element={<RoleLazyPage roles={['CLASS_ADMIN']}><AssignmentsV2Page /></RoleLazyPage>} />
      <Route path="/admin/grading" element={<RoleLazyPage roles={['CLASS_ADMIN']}><GradingV2Page /></RoleLazyPage>} />
      <Route path="/admin/materials" element={<RoleFrame roles={['CLASS_ADMIN']}><MaterialsLibraryPage /></RoleFrame>} />
      <Route path="/admin/notifications" element={<RoleFrame roles={['CLASS_ADMIN']}><NotificationsInboxPage /></RoleFrame>} />
      <Route path="/admin/attendance" element={<RoleFrame roles={['CLASS_ADMIN']}><AttendanceMarkingPage /></RoleFrame>} />
      <Route path="/admin/calendar" element={<RoleLazyPage roles={['CLASS_ADMIN']}><CalendarPage /></RoleLazyPage>} />

      <Route path="/student/home" element={<RoleFrame roles={['STUDENT']}><StudentHomePage /></RoleFrame>} />
      <Route path="/student/classes" element={<RoleFrame roles={['STUDENT']}><StudentClassesPage /></RoleFrame>} />
      <Route path="/student/classes/:classId" element={<RoleFrame roles={['STUDENT']}><StudentClassDetailPage /></RoleFrame>} />
      <Route path="/student/assignments" element={<RoleFrame roles={['STUDENT']}><StudentAssignmentsPage /></RoleFrame>} />
      <Route path="/student/assignments/:assignmentId" element={<RoleFrame roles={['STUDENT']}><StudentAssignmentDetailPage /></RoleFrame>} />
      <Route path="/student/submissions" element={<RoleFrame roles={['STUDENT']}><StudentSubmissionsPage /></RoleFrame>} />
      <Route path="/student/submissions/:submissionId" element={<RoleFrame roles={['STUDENT']}><StudentSubmissionsPage /></RoleFrame>} />
      <Route path="/student/grades" element={<RoleFrame roles={['STUDENT']}><StudentGradesPage /></RoleFrame>} />
      <Route path="/student/attendance" element={<RoleFrame roles={['STUDENT']}><StudentAttendancePage /></RoleFrame>} />
      <Route path="/student/materials" element={<RoleFrame roles={['STUDENT']}><MaterialsPage /></RoleFrame>} />
      <Route path="/student/calendar" element={<RoleLazyPage roles={['STUDENT']}><CalendarPage /></RoleLazyPage>} />
      <Route path="/student/notifications" element={<RoleFrame roles={['STUDENT']}><NotificationsInboxPage /></RoleFrame>} />
      <Route path="/student/submit" element={<RoleFrame roles={['STUDENT']}><StudentAssignmentSubmitPage /></RoleFrame>} />

      <Route path="/bang-dieu-khien" element={<AppLazyPage><DashboardPage /></AppLazyPage>} />
      <Route path="/lop-hoc" element={<AppFrame><ClassesPage /></AppFrame>} />
      <Route path="/lop-hoc/:classId" element={<AppLazyPage><ClassDetailV2Page /></AppLazyPage>} />
      <Route path="/bai-tap" element={<AppLazyPage><AssignmentsV2Page /></AppLazyPage>} />
      <Route path="/tai-lieu" element={<AppFrame><MaterialsPage /></AppFrame>} />
      <Route path="/thong-bao" element={<AppFrame><NotificationsInboxPage /></AppFrame>} />
      <Route path="/notifications" element={<AppFrame><NotificationsInboxPage /></AppFrame>} />
      <Route path="/diem-danh" element={<AppFrame><AttendancePage /></AppFrame>} />
      <Route path="/lich-hoc" element={<AppLazyPage><CalendarPage /></AppLazyPage>} />
      <Route path="/nguoi-dung" element={<RoleFrame roles={['TEACHER_OWNER']}><UsersPage /></RoleFrame>} />
      <Route path="/cham-bai" element={<RoleLazyPage roles={['TEACHER_OWNER', 'CLASS_ADMIN']}><GradingV2Page /></RoleLazyPage>} />
      <Route path="/doi-mat-khau" element={<AppFrame><ChangePasswordPage /></AppFrame>} />

      <Route path="/dashboard" element={<Navigate to="/bang-dieu-khien" replace />} />
      <Route path="/classes" element={<Navigate to="/lop-hoc" replace />} />
      <Route path="/assignments" element={<Navigate to="/bai-tap" replace />} />
      <Route path="/users" element={<Navigate to="/nguoi-dung" replace />} />
      <Route path="/reports" element={<Navigate to="/bao-cao" replace />} />
      <Route path="/materials" element={<Navigate to="/tai-lieu" replace />} />
      <Route path="/grading" element={<Navigate to="/cham-bai" replace />} />
      <Route path="/attendance" element={<Navigate to="/diem-danh" replace />} />
      <Route path="/calendar" element={<Navigate to="/lich-hoc" replace />} />

      <Route path="/khong-co-quyen" element={<ForbiddenPage />} />
      <Route path="/" element={<Navigate to="/bang-dieu-khien" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
