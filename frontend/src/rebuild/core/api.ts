import { API_BASE_URL, deleteApi, downloadBlobToFile, getApi, patchApi, postApi } from './http'
import type {
  ActivityItem,
  AssignmentItem,
  AttendanceItem,
  AttendanceStatus,
  AuthUser,
  CalendarEvent,
  ClassItem,
  ClassStatus,
  FileItem,
  GradeItem,
  LessonItem,
  LessonStatus,
  MaterialItem,
  MemberStatus,
  NotificationItem,
  PageResponse,
  QueryParams,
  RoleName,
  StudentMemberItem,
  SubmissionItem,
  TargetType,
  UserItem,
  UserStatus,
} from './types'

type LoginPayload = { accessToken: string; tokenType?: string; expiresIn?: number; user: AuthUser }

export type TeacherDashboard = {
  activeClassCount: number
  activeStudentCount: number
  dueSoonAssignmentCount: number
  needGradingByClass: Array<{ classId: string; className: string; count: number }>
}

export type AdminDashboard = {
  dueSoonAssignmentCount: number
  missingSubmissionCount: number
  assignmentsDueSoon: Array<{ assignmentId: string; title: string; classId: string; className: string; deadline: string }>
}

export type StudentDashboard = {
  joinedClassCount: number
  openAssignmentCount: number
  dueSoonCount: number
  gradedCount: number
  resubmitRequestedCount: number
}

type AssignmentProgress = { assignmentId: string; totalStudents: number; submittedCount: number; missingCount: number; lateCount: number; gradedCount: number; needGradingCount: number }
type AssignmentReminderPreview = AssignmentProgress & { assignmentTitle?: string; classId?: string; className?: string; missingStudents?: Array<{ studentId: string; fullName: string; email?: string | null; phone?: string | null }> }
type AssignmentReminderDispatch = { notificationId: string; assignmentId: string; recipientCount: number; title: string; content: string; createdAt: string }
type BatchAssignmentReminderDispatch = { assignmentCount: number; totalRecipients: number; dispatches: AssignmentReminderDispatch[] }
type AttendanceSummary = { classId: string; totalLessons: number; attendanceRate: number; studentAttendance: unknown[] }

function normalizeList<T>(data: T[] | PageResponse<T>): T[] {
  return Array.isArray(data) ? data : data.items
}

export const api = {
  login: (identifier: string, password: string) => postApi<LoginPayload>('/auth/login', { identifier, password }),
  me: () => getApi<AuthUser>('/auth/me'),
  updateMe: (payload: Partial<Pick<AuthUser, 'fullName' | 'phone' | 'avatarUrl'>>) => patchApi<AuthUser>('/me', payload),
  changePassword: (currentPassword: string, newPassword: string) => postApi<string>('/auth/change-password', { currentPassword, newPassword }),
  logout: () => postApi<string>('/auth/logout'),

  dashboardTeacher: () => getApi<TeacherDashboard>('/dashboard/teacher'),
  dashboardAdmin: () => getApi<AdminDashboard>('/dashboard/admin'),
  dashboardStudent: () => getApi<StudentDashboard>('/dashboard/student'),

  usersPage: (params?: QueryParams) => getApi<PageResponse<UserItem> | UserItem[]>('/users', params),
  users: async (params?: QueryParams) => normalizeList(await api.usersPage(params)),
  user: (id: string) => getApi<UserItem>(`/users/${id}`),
  createUser: (payload: { fullName: string; email?: string; phone?: string; role: RoleName; note?: string }) => postApi<UserItem>('/users', payload),
  updateUser: (id: string, payload: Partial<Pick<UserItem, 'fullName' | 'email' | 'phone' | 'studentCode' | 'note'>>) => patchApi<UserItem>(`/users/${id}`, payload),
  updateUserStatus: (id: string, status: UserStatus) => patchApi<UserItem>(`/users/${id}/status`, { status }),
  deleteUser: (id: string) => deleteApi<string>(`/users/${id}`),
  studentProgress: (id: string) => getApi<{ totalAssignments: number; submittedAssignments: number; gradedAssignments: number; averageScore: number }>(`/users/${id}/progress`),

  classesPage: (params?: QueryParams) => getApi<PageResponse<ClassItem> | ClassItem[]>('/classes', params),
  classes: async (params?: QueryParams) => normalizeList(await api.classesPage(params)),
  classById: (id: string) => getApi<ClassItem>(`/classes/${id}`),
  createClass: (payload: { name: string; code: string; description?: string; status?: ClassStatus; levelFrom?: number; levelTo?: number; startDate?: string; endDate?: string }) => postApi<ClassItem>('/classes', payload),
  updateClass: (id: string, payload: Partial<{ name: string; code: string; description: string; levelFrom: number; levelTo: number; status: ClassStatus; startDate: string; endDate: string }>) => patchApi<ClassItem>(`/classes/${id}`, payload),
  deleteClass: (id: string) => deleteApi<string>(`/classes/${id}`),
  listClassStudentsPage: (id: string, params?: QueryParams) => getApi<PageResponse<StudentMemberItem> | StudentMemberItem[]>(`/classes/${id}/students`, params),
  listClassStudents: async (id: string, params?: QueryParams) => normalizeList(await api.listClassStudentsPage(id, params)),
  addClassStudent: (id: string, payload: { studentId?: string; userId?: string }) => postApi<string>(`/classes/${id}/students`, payload),
  addClassStudentsBulk: (id: string, studentIds: string[]) => postApi<{ added: number; reactivated: number; skipped: number; errors: string[] }>(`/classes/${id}/students/bulk`, studentIds),
  updateClassStudentCode: (id: string, studentId: string, studentCode: string) => patchApi<StudentMemberItem>(`/classes/${id}/students/${studentId}/code`, { studentCode }),
  removeClassStudent: (id: string, studentId: string) => deleteApi<string>(`/classes/${id}/students/${studentId}`),
  updateClassStudentStatus: (id: string, studentId: string, status: MemberStatus) => patchApi<string>(`/classes/${id}/students/${studentId}/status`, { status }),
  addClassAdmin: (id: string, payload: { adminId?: string; userId?: string }) => postApi<string>(`/classes/${id}/admins`, payload),
  removeClassAdmin: (id: string, adminId: string) => deleteApi<string>(`/classes/${id}/admins/${adminId}`),
  lessonsByClassPage: (classId: string, params?: QueryParams) => getApi<PageResponse<LessonItem> | LessonItem[]>(`/classes/${classId}/lessons`, params),
  lessonsByClass: async (classId: string, params?: QueryParams) => normalizeList(await api.lessonsByClassPage(classId, params)),
  createLesson: (classId: string, payload: { title: string; description?: string; lessonDate?: string; orderIndex?: number; status?: LessonStatus }) => postApi<LessonItem>(`/classes/${classId}/lessons`, payload),
  lessonById: (lessonId: string) => getApi<LessonItem>(`/lessons/${lessonId}`),
  updateLesson: (lessonId: string, payload: Partial<{ title: string; description: string; lessonDate: string; orderIndex: number; status: LessonStatus }>) => patchApi<LessonItem>(`/lessons/${lessonId}`, payload),
  deleteLesson: (lessonId: string) => deleteApi<string>(`/lessons/${lessonId}`),

  materialsByClassPage: (classId: string, params?: QueryParams) => getApi<PageResponse<MaterialItem> | MaterialItem[]>(`/classes/${classId}/materials`, params),
  materialsByClass: async (classId: string, params?: QueryParams) => normalizeList(await api.materialsByClassPage(classId, params)),
  createMaterial: (classId: string, payload: { title: string; description?: string; externalUrl?: string; fileId?: string; visible?: boolean }) => postApi<MaterialItem>(`/classes/${classId}/materials`, payload),
  materialById: (materialId: string) => getApi<MaterialItem>(`/materials/${materialId}`),
  updateMaterial: (materialId: string, payload: Partial<{ title: string; description: string; externalUrl: string; fileId: string; visible: boolean }>) => patchApi<MaterialItem>(`/materials/${materialId}`, payload),
  updateMaterialVisibility: (materialId: string, visible: boolean) => patchApi<MaterialItem>(`/materials/${materialId}/visibility`, { visible }),
  deleteMaterial: (materialId: string) => deleteApi<string>(`/materials/${materialId}`),

  assignmentsPage: (params?: QueryParams & { classId?: string }) => params?.classId ? getApi<PageResponse<AssignmentItem> | AssignmentItem[]>(`/classes/${params.classId}/assignments`, params) : getApi<PageResponse<AssignmentItem> | AssignmentItem[]>('/assignments', params),
  assignments: async (classId?: string) => normalizeList(await api.assignmentsPage(classId ? { classId } : undefined)),
  assignmentById: (assignmentId: string) => getApi<AssignmentItem>(`/assignments/${assignmentId}`),
  assignmentProgress: (assignmentId: string) => getApi<AssignmentProgress>(`/assignments/${assignmentId}/progress`),
  createAssignment: (classId: string, payload: { title: string; description?: string; instruction?: string; dueAt?: string; maxScore: number; status?: AssignmentItem['status']; allowResubmit?: boolean; skill?: string; fileId?: string; externalLink?: string }) => postApi<AssignmentItem>(`/classes/${classId}/assignments`, payload),
  createAssignmentsMulti: (payload: { classIds: string[]; title: string; description?: string; instruction?: string; dueAt?: string; maxScore?: number; allowResubmit?: boolean; skill?: string; fileId?: string; fileIds?: string[]; externalLink?: string }) => postApi<AssignmentItem[]>('/assignments', payload),
  updateAssignment: (assignmentId: string, payload: Partial<{ title: string; description: string; instruction: string; dueAt: string; maxScore: number; status: AssignmentItem['status']; allowResubmit: boolean; skill: string; fileId: string; fileIds: string[]; externalLink: string }>) => patchApi<AssignmentItem>(`/assignments/${assignmentId}`, payload),
  publishAssignment: (assignmentId: string) => patchApi<AssignmentItem>(`/assignments/${assignmentId}/publish`),
  closeAssignment: (assignmentId: string) => patchApi<AssignmentItem>(`/assignments/${assignmentId}/close`),
  copyAssignment: (assignmentId: string) => postApi<AssignmentItem>(`/assignments/${assignmentId}/copy`),
  deleteAssignment: (assignmentId: string) => deleteApi<null>(`/assignments/${assignmentId}`),
  assignmentMissingStudents: (assignmentId: string) => getApi<AssignmentReminderPreview>(`/assignments/${assignmentId}/missing-students`),
  sendAssignmentReminder: (assignmentId: string, payload?: { title?: string; content?: string }) => postApi<AssignmentReminderDispatch>(`/assignments/${assignmentId}/send-reminder`, payload),
  sendClassAssignmentReminders: (classId: string, payload?: { assignmentIds?: string[]; title?: string; content?: string }) => postApi<BatchAssignmentReminderDispatch>(`/classes/${classId}/assignments/send-reminders`, payload),

  submissionsByAssignmentPage: (assignmentId: string, params?: QueryParams) => getApi<PageResponse<SubmissionItem> | SubmissionItem[]>(`/assignments/${assignmentId}/submissions`, params),
  submissionsByAssignment: async (assignmentId: string, params?: QueryParams) => normalizeList(await api.submissionsByAssignmentPage(assignmentId, params)),
  submitAssignment: (assignmentId: string, payload: { contentText?: string; contentUrl?: string; fileId?: string; fileIds?: string[] }) => postApi<SubmissionItem>(`/assignments/${assignmentId}/submissions`, payload),
  submissionById: (submissionId: string) => getApi<SubmissionItem>(`/submissions/${submissionId}`),
  updateSubmission: (submissionId: string, payload: Partial<{ contentText: string; contentUrl: string; fileId: string; fileIds: string[] }>) => patchApi<SubmissionItem>(`/submissions/${submissionId}`, payload),
  deleteSubmission: (submissionId: string) => deleteApi<null>(`/submissions/${submissionId}`),
  mySubmissionsPage: (params?: QueryParams) => getApi<PageResponse<SubmissionItem> | SubmissionItem[]>('/me/submissions', params),
  mySubmissions: async (params?: QueryParams) => normalizeList(await api.mySubmissionsPage(params)),

  classGradingSubmissionsPage: (classId: string, params?: QueryParams) => getApi<PageResponse<SubmissionItem> | SubmissionItem[]>(`/classes/${classId}/grading/submissions`, params),
  gradingSubmissionsPage: (params?: QueryParams & { classId?: string }) => getApi<PageResponse<SubmissionItem> | SubmissionItem[]>('/grading/submissions', params),
  classGradingSubmissions: async (classId: string, params?: QueryParams) => normalizeList(await api.classGradingSubmissionsPage(classId, params)),
  gradeSubmission: (submissionId: string, payload: { score: number; feedback?: string; feedbackFileId?: string; feedbackLink?: string }) => postApi<GradeItem>(`/submissions/${submissionId}/grade`, payload),
  updateGrade: (gradeId: string, payload: { score: number; feedback?: string; feedbackFileId?: string; feedbackLink?: string }) => patchApi<GradeItem>(`/grades/${gradeId}`, payload),
  requestResubmit: (submissionId: string) => postApi<null>(`/submissions/${submissionId}/request-resubmit`),
  downloadSubmissionsZip: (assignmentId: string, classId?: string) => downloadBlobToFile(`/assignments/${assignmentId}/submissions/export-zip`, `submissions-${assignmentId}.zip`, classId ? { classId } : undefined),

  notificationsPage: (params?: QueryParams) => getApi<PageResponse<NotificationItem> | NotificationItem[]>('/notifications', params),
  notifications: async (params?: QueryParams) => normalizeList(await api.notificationsPage(params)),
  unreadNotificationCount: () => getApi<{ count: number }>('/notifications/unread-count'),
  markAllNotificationsRead: () => postApi<{ count?: number } | string>('/notifications/read-all'),
  createNotification: (payload: { title: string; content: string; targetType: TargetType; targetId?: string }) => postApi<NotificationItem>('/notifications', payload),
  deleteNotification: (id: string) => deleteApi<null>(`/notifications/${id}`),
  markNotificationRead: (id: string) => postApi<NotificationItem>(`/notifications/${id}/read`),

  recentActivityPage: (params?: QueryParams) => getApi<PageResponse<ActivityItem> | ActivityItem[]>('/activity/recent', params),
  recentActivity: async (params?: QueryParams) => normalizeList(await api.recentActivityPage(params)),
  classActivityPage: (classId: string, params?: QueryParams) => getApi<PageResponse<ActivityItem> | ActivityItem[]>(`/classes/${classId}/activity`, params),
  classActivity: async (classId: string, params?: QueryParams) => normalizeList(await api.classActivityPage(classId, params)),

  uploadFile: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return postApi<FileItem>('/files/upload', form)
  },
  fileMetadata: (fileId: string) => getApi<FileItem>(`/files/${fileId}`),
  previewFileUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/preview`,
  downloadFileUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/download`,
  downloadFile: (fileId: string, filename = `file-${fileId}`) => downloadBlobToFile(`/files/${fileId}/download`, filename),
  downloadSubmissionFile: (submissionId: string, filename?: string) => downloadBlobToFile(`/submissions/${submissionId}/files/submission/download`, filename || `submission-${submissionId}`),
  downloadFeedbackFile: (submissionId: string, filename?: string) => downloadBlobToFile(`/submissions/${submissionId}/files/feedback/download`, filename || `feedback-${submissionId}`),

  attendanceSummary: (classId: string) => getApi<AttendanceSummary>(`/classes/${classId}/attendance/summary`),
  markLessonAttendance: (lessonId: string, records: Array<{ studentId: string; status: AttendanceStatus; note?: string }>) => postApi<AttendanceItem[]>(`/lessons/${lessonId}/attendance`, { records }),
  lessonAttendance: (lessonId: string) => getApi<AttendanceItem[]>(`/lessons/${lessonId}/attendance`),
  studentAttendance: async (studentId: string) => normalizeList(await getApi<PageResponse<AttendanceItem> | AttendanceItem[]>(`/students/${studentId}/attendance`)),
  updateAttendance: (attendanceId: string, payload: Partial<{ status: AttendanceStatus; note: string }>) => patchApi<AttendanceItem>(`/attendance/${attendanceId}`, payload),

  calendar: (params: { from: string; to: string; classId?: string }) => getApi<{ events: CalendarEvent[] }>('/calendar', params),
}
