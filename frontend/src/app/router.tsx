import { Navigate, Route, Routes } from 'react-router-dom'
import { AssignmentDetailPage, AssignmentSubmissionsPage, AssignmentsPage, ChangePasswordPage, ClassAssignmentsPage, ClassDetailPage, ClassesPage, DashboardPage, ForbiddenPage, LoginPage, MaterialsPage, MySubmissionsPage, NotFoundPage, NotificationsPage, ProtectedRoute, UsersPage, UserDetailPage, SubmissionDetailPage, GradingPage, ReportsPage } from '../pages'

export function AppRouter() {
  return <Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
    <Route path="/classes" element={<ProtectedRoute><ClassesPage/></ProtectedRoute>}/>
    <Route path="/classes/:classId" element={<ProtectedRoute><ClassDetailPage/></ProtectedRoute>}/>
    <Route path="/classes/:classId/materials" element={<ProtectedRoute><MaterialsPage/></ProtectedRoute>}/>
    <Route path="/classes/:classId/assignments" element={<ProtectedRoute><ClassAssignmentsPage/></ProtectedRoute>}/>
    <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage/></ProtectedRoute>}/>
    <Route path="/assignments/:assignmentId" element={<ProtectedRoute><AssignmentDetailPage/></ProtectedRoute>}/>
    <Route path="/assignments/:assignmentId/submissions" element={<ProtectedRoute roles={['TEACHER_OWNER','CLASS_ADMIN']}><AssignmentSubmissionsPage/></ProtectedRoute>}/>
    <Route path="/submissions/:submissionId" element={<ProtectedRoute><SubmissionDetailPage/></ProtectedRoute>}/>
    <Route path="/grading" element={<ProtectedRoute roles={['TEACHER_OWNER','CLASS_ADMIN']}><GradingPage/></ProtectedRoute>}/>
    <Route path="/me/submissions" element={<ProtectedRoute roles={['STUDENT']}><MySubmissionsPage/></ProtectedRoute>}/>
    <Route path="/users" element={<ProtectedRoute roles={['TEACHER_OWNER']}><UsersPage/></ProtectedRoute>}/>
    <Route path="/users/:userId" element={<ProtectedRoute roles={['TEACHER_OWNER']}><UserDetailPage/></ProtectedRoute>}/>
    <Route path="/reports" element={<ProtectedRoute roles={['TEACHER_OWNER']}><ReportsPage/></ProtectedRoute>}/>
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage/></ProtectedRoute>}/>
    <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage/></ProtectedRoute>}/>
    <Route path="/forbidden" element={<ForbiddenPage/>}/>
    <Route path="/" element={<Navigate to="/dashboard"/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes>
}
