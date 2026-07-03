# HOA NOBITA Backend API Spec (for Frontend Rebuild)

## 1) Base Information

- Base URL: `/api/v1`
- Auth: JWT Bearer token in header
  - `Authorization: Bearer <accessToken>`
- Public endpoint:
  - `POST /api/v1/auth/login`
- All other endpoints require authentication.

## 2) Standard Response Envelope

Most endpoints return:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "errors": null
}
```

Error shape:

```json
{
  "success": false,
  "message": "Validation failed | Unauthorized | Access denied | ...",
  "data": null,
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

Notes:
- `POST` create endpoints usually return message `Created`.
- File download endpoint returns binary stream (`Resource`) instead of ApiResponse.

## 3) Enums Used Across API

- `RoleName`: `TEACHER_OWNER`, `CLASS_ADMIN`, `STUDENT`
- `UserStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
- `ClassStatus`: `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED`
- `LessonStatus`: `DRAFT`, `PUBLISHED`
- `AssignmentStatus`: `DRAFT`, `PUBLISHED`, `CLOSED`
- `SubmissionStatus`: `SUBMITTED`, `LATE`, `GRADED`, `RESUBMIT_REQUESTED`
- `TargetType`: `CLASS`, `USER`, `ALL`
- `MemberStatus`: `ACTIVE`, `PAUSED`, `REMOVED`
- `AttendanceStatus`: `PRESENT`, `ABSENT`, `LATE`

---

## 4) Pagination & List Query Standard

List endpoints support these query params unless noted otherwise:

```text
?page=1&size=20&sort=createdAt,desc&search=keyword&status=ACTIVE&classId=uuid
```

Rules:
- `page`: 1-based page number. Default `1`.
- `size`: default `20`, max `100`.
- `sort`: `field,asc` or `field,desc`.
- `search`: case-insensitive search on common display fields such as name/title/email/message.
- `status`: endpoint-specific enum filter where supported.
- `classId`: supported by global list endpoints where applicable.

Paginated output (`PageResponse<T>`):

```json
{
  "items": [],
  "page": 1,
  "size": 20,
  "totalItems": 100,
  "totalPages": 5
}
```

Affected list endpoints:
- `GET /users`
- `GET /classes`
- `GET /classes/{classId}/students`
- `GET /classes/{classId}/lessons`
- `GET /classes/{classId}/materials`
- `GET /classes/{classId}/assignments`
- `GET /assignments`
- `GET /assignments/{assignmentId}/submissions`
- `GET /me/submissions`
- `GET /notifications`
- `GET /classes/{classId}/grading/submissions`
- `GET /activity/recent`
- `GET /classes/{classId}/activity`
- `GET /users/{id}/activity-logs`

---

## 5) Auth APIs

### POST /auth/login
Input (`LoginRequest`):
```json
{
  "identifier": "email-or-phone",
  "password": "string"
}
```
Output (`LoginResponse`):
```json
{
  "accessToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "fullName": "string",
    "email": "string|null",
    "phone": "string|null",
    "roles": ["TEACHER_OWNER"],
    "firstLogin": true
  }
}
```

### GET /auth/me
Input: none
Output: current user info (same user shape as login response).

### POST /auth/change-password
Input (`ChangePasswordRequest`):
```json
{
  "currentPassword": "string",
  "newPassword": "min-8-char"
}
```
Output:
```json
"Password changed successfully"
```

### POST /auth/logout
Input: none
Output:
```json
"Logged out successfully"
```

---

## 6) User & Profile APIs

### PATCH /me
Access: authenticated current user
Input (`UpdateProfileRequest`):
```json
{
  "fullName": "string|null",
  "phone": "string|null",
  "avatarUrl": "string|null"
}
```
Output: `UserResponse` for current user. `temporaryPassword` is not included for normal self-update usage.

### GET /users
Role: `TEACHER_OWNER`
Query: pagination standard + `search`, `status`
Output: `PageResponse<UserResponse>`

### POST /users
Role: `TEACHER_OWNER`
Input (`CreateUserRequest`):
```json
{
  "fullName": "string",
  "email": "string|null",
  "phone": "string|null",
  "role": "TEACHER_OWNER|CLASS_ADMIN|STUDENT",
  "note": "string|null"
}
```
Output: `UserResponse` (may include `temporaryPassword` in dev/local).

### GET /users/{id}
Role: `TEACHER_OWNER`
Output: `UserResponse`

### GET /users/{id}/activity-logs
Access:
- Student: only self
- Class admin: only students in assigned classes
- Teacher owner: allowed
Query: pagination standard + `search`
Output: `PageResponse<ActivityResponse>`

### GET /users/{id}/progress
Access:
- Student: only self
- Class admin: only students in assigned classes
- Teacher owner: allowed

Output (`StudentProgressResponse`):
```json
{
  "totalAssignments": 0,
  "submittedAssignments": 0,
  "gradedAssignments": 0,
  "averageScore": 0,
  "submissionRate": 0,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "riskReasons": ["string"]
}
```

### PATCH /users/{id}
Role: `TEACHER_OWNER`
Input (`UpdateUserRequest`):
```json
{
  "fullName": "string|null",
  "email": "string|null",
  "phone": "string|null",
  "note": "string|null"
}
```
Output: `UserResponse`

### PATCH /users/{id}/status
Role: `TEACHER_OWNER`
Input (`StatusRequest`):
```json
{ "status": "ACTIVE|INACTIVE|SUSPENDED" }
```
Output: `UserResponse`

### DELETE /users/{id}
Role: `TEACHER_OWNER`
Output:
```json
"User deleted"
```

`UserResponse` shape:
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string|null",
  "phone": "string|null",
  "status": "ACTIVE|INACTIVE|SUSPENDED",
  "firstLogin": true,
  "avatarUrl": "string|null",
  "note": "string|null",
  "roles": ["TEACHER_OWNER|CLASS_ADMIN|STUDENT"],
  "createdAt": "ISO-8601",
  "temporaryPassword": "string|null"
}
```

---

## 7) Classroom APIs

### GET /classes
Query: pagination standard + `search`, `status`
Output: `PageResponse<ClassResponse>` (filtered by role permissions)

### POST /classes
Role: `TEACHER_OWNER`
Input (`CreateClassRequest`):
```json
{
  "name": "string",
  "code": "string",
  "description": "string|null",
  "levelFrom": 1,
  "levelTo": 6,
  "startDate": "YYYY-MM-DD|null",
  "endDate": "YYYY-MM-DD|null"
}
```
Output: `ClassResponse`

### GET /classes/{classId}
Output: `ClassResponse`

### PATCH /classes/{classId}
Input (`UpdateClassRequest`):
```json
{
  "name": "string|null",
  "description": "string|null",
  "levelFrom": 1,
  "levelTo": 6,
  "status": "DRAFT|ACTIVE|COMPLETED|ARCHIVED",
  "startDate": "YYYY-MM-DD|null",
  "endDate": "YYYY-MM-DD|null"
}
```
Output: `ClassResponse`

### DELETE /classes/{classId}
Role: teacher
Output:
```json
"Class deleted"
```

### POST /classes/{classId}/admins
Role: teacher
Input (`AddMemberRequest`):
```json
{ "adminId": "uuid" }
```
or
```json
{ "userId": "uuid" }
```
Output:
```json
"Admin assigned"
```

### DELETE /classes/{classId}/admins/{adminId}
Role: teacher
Output:
```json
"Admin removed"
```

### GET /classes/{classId}/students
Query: pagination standard + `search`, `status`
Output: `PageResponse<StudentMemberResponse>`

`StudentMemberResponse`:
```json
{
  "id": "uuid",
  "fullName": "string",
  "email": "string|null",
  "studentCode": "C01|null",
  "status": "ACTIVE|PAUSED|REMOVED",
  "joinedAt": "ISO-8601"
}
```

### PATCH /classes/{classId}/students/{studentId}/code
Input (`StudentCodeRequest`):
```json
{ "studentCode": "C01" }
```
Output: `StudentMemberResponse`

### POST /classes/{classId}/students
Input (`AddMemberRequest`):
```json
{ "studentId": "uuid" }
```
or
```json
{ "userId": "uuid" }
```
Output:
```json
"Student added"
```

### POST /classes/{classId}/students/bulk
Input: UUID array
```json
["uuid-1", "uuid-2"]
```
Output (`BulkAddStudentsResult`):
```json
{
  "added": 0,
  "reactivated": 0,
  "skipped": 0,
  "errors": ["string"]
}
```

### DELETE /classes/{classId}/students/{studentId}
Output:
```json
"Student removed"
```

### PATCH /classes/{classId}/students/{studentId}/status
Input (`StatusRequest`):
```json
{ "status": "ACTIVE|PAUSED|REMOVED" }
```
Output:
```json
"Student status updated"
```

### GET /classes/{classId}/students/export?format=csv
Role: `TEACHER_OWNER|CLASS_ADMIN`
Output: CSV download stream.
Columns:
```text
studentCode,fullName,email,status,joinedAt
```

### GET /classes/{classId}/stats
Output (`ClassStatsResponse`):
```json
{
  "classId": "uuid",
  "totalStudents": 0,
  "totalAssignments": 0,
  "totalSubmissions": 0,
  "missingSubmissions": 0,
  "lateSubmissions": 0,
  "gradedSubmissions": 0,
  "needGrading": 0,
  "submissionRate": 0,
  "averageScore": 0
}
```

`ClassResponse` shape:
```json
{
  "id": "uuid",
  "name": "string",
  "code": "string",
  "description": "string|null",
  "levelFrom": 1,
  "levelTo": 6,
  "status": "DRAFT|ACTIVE|COMPLETED|ARCHIVED",
  "teacherId": "uuid",
  "teacherName": "string",
  "startDate": "YYYY-MM-DD|null",
  "endDate": "YYYY-MM-DD|null",
  "studentCount": 0,
  "admins": [{ "id": "uuid", "fullName": "string" }],
  "createdAt": "ISO-8601"
}
```

---

## 8) Lesson APIs

### GET /classes/{classId}/lessons
Query: pagination standard + `search`, `status`
Output: `PageResponse<LessonResponse>`

### POST /classes/{classId}/lessons
Input (`LessonRequest`):
```json
{
  "title": "string",
  "description": "string|null",
  "lessonDate": "YYYY-MM-DD|null",
  "orderIndex": 1,
  "status": "DRAFT|PUBLISHED"
}
```
Output: `LessonResponse`

### GET /lessons/{lessonId}
Output: `LessonResponse`

### PATCH /lessons/{lessonId}
Input: `LessonRequest`
Output: `LessonResponse`

### DELETE /lessons/{lessonId}
Output:
```json
"Lesson deleted"
```

`LessonResponse`:
```json
{
  "id": "uuid",
  "classId": "uuid",
  "title": "string",
  "description": "string|null",
  "lessonDate": "YYYY-MM-DD|null",
  "orderIndex": 1,
  "status": "DRAFT|PUBLISHED",
  "createdAt": "ISO-8601"
}
```

---

## 9) Material APIs

### GET /classes/{classId}/materials
Query: pagination standard + `search`
Output: `PageResponse<MaterialResponse>`

### POST /classes/{classId}/materials
Input (`MaterialRequest`):
```json
{
  "title": "string",
  "description": "string|null",
  "externalUrl": "string|null",
  "fileId": "uuid|null",
  "visible": true
}
```
Output: `MaterialResponse`

### GET /materials/{materialId}
Output: `MaterialResponse`

### PATCH /materials/{materialId}
Input: `MaterialRequest`
Output: `MaterialResponse`

### DELETE /materials/{materialId}
Output:
```json
"Material deleted"
```

### PATCH /materials/{materialId}/visibility
Input:
```json
{ "visible": true }
```
Output: `MaterialResponse`

`MaterialResponse`:
```json
{
  "id": "uuid",
  "classId": "uuid",
  "lessonId": "uuid|null",
  "fileId": "uuid|null",
  "title": "string",
  "description": "string|null",
  "externalUrl": "string|null",
  "visible": true,
  "createdAt": "ISO-8601"
}
```

---

## 10) Assignment APIs

### GET /classes/{classId}/assignments
Query: pagination standard + `search`, `status`
Output: `PageResponse<AssignmentResponse>`

### GET /assignments
Query: pagination standard + `search`, `status`, `classId`
Output: `PageResponse<AssignmentResponse>`

### POST /classes/{classId}/assignments
Input (`AssignmentRequest`):
```json
{
  "title": "string",
  "description": "string|null",
  "instruction": "string|null",
  "dueAt": "ISO-8601|null",
  "maxScore": 10,
  "status": "DRAFT|PUBLISHED|CLOSED|null",
  "allowResubmit": true
}
```
Output: `AssignmentResponse`

### GET /assignments/{assignmentId}
Output: `AssignmentResponse`

### GET /assignments/{assignmentId}/progress
Output (`AssignmentProgressResponse`):
```json
{
  "assignmentId": "uuid",
  "totalStudents": 0,
  "submittedCount": 0,
  "missingCount": 0,
  "lateCount": 0,
  "gradedCount": 0,
  "needGradingCount": 0
}
```

### PATCH /assignments/{assignmentId}
Input: `AssignmentRequest`
Output: `AssignmentResponse`

### PATCH /assignments/{assignmentId}/publish
Output: `AssignmentResponse`

### PATCH /assignments/{assignmentId}/close
Output: `AssignmentResponse`

### POST /assignments/{assignmentId}/copy
Output: `AssignmentResponse`

### DELETE /assignments/{assignmentId}
Output: `data: null`

### GET /assignments/{assignmentId}/missing-students
Output (`AssignmentReminderPreviewResponse`):
```json
{
  "assignmentId": "uuid",
  "assignmentTitle": "string",
  "classId": "uuid",
  "className": "string",
  "deadline": "ISO-8601|null",
  "totalStudents": 0,
  "submittedCount": 0,
  "missingCount": 0,
  "missingStudents": [
    {
      "studentId": "uuid",
      "fullName": "string",
      "email": "string|null",
      "phone": "string|null"
    }
  ]
}
```

### POST /assignments/{assignmentId}/send-reminder
Input (`AssignmentReminderRequest`, optional body):
```json
{
  "title": "string|null",
  "content": "string|null"
}
```
Output (`AssignmentReminderDispatchResponse`):
```json
{
  "notificationId": "uuid",
  "assignmentId": "uuid",
  "recipientCount": 0,
  "title": "string",
  "content": "string",
  "createdAt": "ISO-8601"
}
```

### POST /classes/{classId}/assignments/send-reminders
Input (`BatchAssignmentReminderRequest`, optional body):
```json
{
  "assignmentIds": ["uuid"],
  "title": "string|null",
  "content": "string|null"
}
```
Output (`BatchAssignmentReminderDispatchResponse`):
```json
{
  "assignmentCount": 0,
  "totalRecipients": 0,
  "dispatches": [
    {
      "notificationId": "uuid",
      "assignmentId": "uuid",
      "recipientCount": 0,
      "title": "string",
      "content": "string",
      "createdAt": "ISO-8601"
    }
  ]
}
```

`AssignmentResponse`:
```json
{
  "id": "uuid",
  "classId": "uuid",
  "className": "string|null",
  "lessonId": "uuid|null",
  "title": "string",
  "description": "string|null",
  "instruction": "string|null",
  "dueAt": "ISO-8601|null",
  "maxScore": 10,
  "status": "DRAFT|PUBLISHED|CLOSED",
  "allowResubmit": true,
  "createdAt": "ISO-8601"
}
```

---

## 11) Submission APIs

### GET /assignments/{assignmentId}/submissions
Query: pagination standard + `search`, `status`
Output: `PageResponse<SubmissionResponse>`

### POST /assignments/{assignmentId}/submissions
Input (`SubmissionRequest`):
```json
{
  "contentText": "string|null",
  "contentUrl": "string|null",
  "fileId": "uuid|null"
}
```
Output: `SubmissionResponse`

### GET /submissions/{submissionId}
Output: `SubmissionResponse`

### PATCH /submissions/{submissionId}
Input: `SubmissionRequest`
Output: `SubmissionResponse`

### DELETE /submissions/{submissionId}
Output: `data: null`

### GET /me/submissions
Query: pagination standard + `search`, `status`, `classId`
Output: `PageResponse<SubmissionResponse>`

`SubmissionResponse`:
```json
{
  "id": "uuid",
  "assignmentId": "uuid",
  "assignmentTitle": "string",
  "className": "string",
  "studentId": "uuid",
  "studentName": "string",
  "contentText": "string|null",
  "contentUrl": "string|null",
  "fileId": "uuid|null",
  "status": "SUBMITTED|LATE|GRADED|RESUBMIT_REQUESTED",
  "submittedAt": "ISO-8601",
  "gradeId": "uuid|null",
  "score": 8.5,
  "maxScore": 10,
  "feedback": "string|null"
}
```

---

## 12) Grading APIs

### GET /classes/{classId}/grading/submissions
Query: pagination standard + `search`, `status`
Output: `PageResponse<SubmissionResponse>`

### POST /assignments/{assignmentId}/submissions/bulk-grade
Input (`BulkGradeRequest`):
```json
{
  "grades": [
    {
      "submissionId": "uuid",
      "score": 8.5,
      "feedback": "string|null"
    }
  ]
}
```
Output (`BulkGradeResponse`):
```json
{
  "gradedCount": 0,
  "failedCount": 0,
  "errors": ["string"]
}
```

### POST /submissions/{submissionId}/grade
Input (`GradeRequest`):
```json
{
  "score": 8.5,
  "feedback": "string|null"
}
```
Output (`GradeResponse`):
```json
{
  "id": "uuid",
  "submissionId": "uuid",
  "score": 8.5,
  "feedback": "string|null",
  "gradedBy": "uuid",
  "gradedAt": "ISO-8601"
}
```

### PATCH /grades/{gradeId}
Input: `GradeRequest`
Output: `GradeResponse`

### POST /submissions/{submissionId}/request-resubmit
Input: none
Output: `data: null`

---

## 13) Notification APIs

### GET /notifications
Query: pagination standard + `search`
Output: `PageResponse<NotificationResponse>`

### GET /notifications/unread-count
Output:
```json
{ "count": 5 }
```

### POST /notifications/read-all
Input: none
Output:
```json
{ "count": 0 }
```

### POST /notifications
Input (`NotificationRequest`):
```json
{
  "title": "string",
  "content": "string",
  "targetType": "ALL|CLASS|USER",
  "targetId": "uuid|null"
}
```
Output: `NotificationResponse`

### DELETE /notifications/{id}
Output: `data: null`

### POST /notifications/{id}/read
Input: none
Output: `NotificationResponse` (updated read state)

`NotificationResponse`:
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "targetType": "ALL|CLASS|USER",
  "targetId": "uuid|null",
  "createdBy": "uuid",
  "createdAt": "ISO-8601",
  "isRead": true,
  "readAt": "ISO-8601|null"
}
```

---

## 14) Dashboard APIs

### GET /dashboard/teacher
Output: `TeacherDashboardResponse`
- Very detailed payload includes:
  - KPI blocks (`classes`, `students`, `assignments`, `submissions`, `grading`, `materials`, `notifications`)
  - Charts (`classStatusChart`, `submissionRateByClass`, `needGradingByClass`, `averageScoreByClass`, `gradeDistribution`, `assignmentWorkflow`)
  - `todayTasks`, `classHealth`, `assignmentsDueSoon`, `riskStudents`, `recentActivity`

### GET /dashboard/admin
Output: `AdminDashboardResponse`
- Includes assigned class metrics, charts, today tasks, recent activity.

### GET /dashboard/student
Output: `StudentDashboardResponse`
- Includes joined class stats, upcoming assignments, recent materials, notifications, own submission stats, recent activity.

Tip for frontend: use exact generated TS types from existing frontend features or map these records 1-1.

---

## 15) Activity APIs

### GET /activity/recent
Query: pagination standard + `search`
Output: `PageResponse<ActivityResponse>` for current user context.

### GET /classes/{classId}/activity
Query: pagination standard + `search`
Output: `PageResponse<ActivityResponse>`

`ActivityResponse`:
```json
{
  "id": "uuid",
  "actionType": "string",
  "targetType": "string",
  "targetId": "uuid|null",
  "targetName": "string|null",
  "actorId": "uuid",
  "actorName": "string",
  "classId": "uuid|null",
  "message": "string",
  "createdAt": "ISO-8601"
}
```

---

## 16) Report APIs

### GET /reports/system
Role: `TEACHER_OWNER`
Output (`SystemReportResponse`):
```json
{
  "totalUsers": 0,
  "totalClasses": 0,
  "totalAssignments": 0,
  "totalSubmissions": 0,
  "averageScore": 0,
  "classPerformances": [
    {
      "classId": "uuid",
      "className": "string",
      "studentCount": 0,
      "assignmentCount": 0,
      "averageScore": 0,
      "submissionRate": 0
    }
  ],
  "topStudents": [
    {
      "userId": "uuid",
      "fullName": "string",
      "email": "string",
      "submissionCount": 0,
      "averageScore": 0
    }
  ]
}
```

### GET /reports/system/export?format=csv
Role: `TEACHER_OWNER`
Output: CSV download stream containing system-level summary and class performance data.

### GET /reports/classes/{classId}
Role: `TEACHER_OWNER|CLASS_ADMIN`
Output (`ClassReportResponse`):
```json
{
  "classId": "uuid",
  "className": "string",
  "totalStudents": 0,
  "totalAssignments": 0,
  "averageScore": 0,
  "submissionRate": 0,
  "studentPerformances": [
    {
      "userId": "uuid",
      "fullName": "string",
      "email": "string",
      "submissionCount": 0,
      "averageScore": 0
    }
  ],
  "assignmentPerformances": [
    {
      "assignmentId": "uuid",
      "title": "string",
      "submissionCount": 0,
      "averageScore": 0,
      "passRate": 0
    }
  ]
}
```

### GET /reports/classes/{classId}/export?format=csv
Role: `TEACHER_OWNER|CLASS_ADMIN`
Output: CSV download stream containing class-level report data.

---

## 17) File APIs

### POST /files/upload
Content-Type: `multipart/form-data`
Form field:
- `file`: binary file

Validation:
- Max size: 10MB
- Allowed types/extensions: PDF, DOC, DOCX, PNG, JPG/JPEG, MP4

Output:
```json
{
  "id": "uuid",
  "originalFileName": "string",
  "contentType": "string",
  "fileSize": 12345
}
```

### GET /files/{fileId}
Output (`FileMetadataResponse`):
```json
{
  "id": "uuid",
  "originalFileName": "string",
  "contentType": "string",
  "fileSize": 12345,
  "createdAt": "ISO-8601|null",
  "createdBy": "uuid|null"
}
```

### GET /files/{fileId}/download
Output: binary file stream
Headers:
- `Content-Disposition: attachment; filename="<originalFileName>"`
- `Content-Type: <stored-content-type>`

---

## 18) Attendance APIs

### GET /classes/{classId}/attendance/summary
Access: `TEACHER_OWNER|CLASS_ADMIN` for accessible class
Output (`AttendanceSummaryResponse`):
```json
{
  "classId": "uuid",
  "totalLessons": 0,
  "attendanceRate": 0,
  "studentAttendance": [
    {
      "studentId": "uuid",
      "studentName": "string",
      "presentCount": 0,
      "absentCount": 0,
      "lateCount": 0,
      "attendanceRate": 0
    }
  ]
}
```

### POST /lessons/{lessonId}/attendance
Input (`AttendanceBulkRequest`):
```json
{
  "records": [
    {
      "studentId": "uuid",
      "status": "PRESENT|ABSENT|LATE",
      "note": "string|null"
    }
  ]
}
```
Output: `AttendanceResponse[]`

### GET /lessons/{lessonId}/attendance
Output: `AttendanceResponse[]`

### GET /students/{studentId}/attendance
Access:
- Student: self only
- Class admin: students in assigned classes
- Teacher owner: all
Output: `AttendanceResponse[]`

### PATCH /attendance/{attendanceId}
Input (`AttendanceUpdateRequest`):
```json
{
  "status": "PRESENT|ABSENT|LATE|null",
  "note": "string|null"
}
```
Output: `AttendanceResponse`

`AttendanceResponse`:
```json
{
  "id": "uuid",
  "lessonId": "uuid",
  "lessonTitle": "string",
  "classId": "uuid",
  "className": "string",
  "studentId": "uuid",
  "studentName": "string",
  "status": "PRESENT|ABSENT|LATE",
  "note": "string|null",
  "createdBy": "uuid|null",
  "createdAt": "ISO-8601"
}
```

---

## 19) Calendar APIs

### GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&classId=uuid
Access:
- Student: own enrolled classes
- Class admin: assigned classes
- Teacher owner: all classes

Output (`CalendarResponse`):
```json
{
  "events": [
    {
      "type": "LESSON",
      "id": "uuid",
      "title": "string",
      "date": "YYYY-MM-DD",
      "dueAt": null,
      "classId": "uuid",
      "className": "string"
    },
    {
      "type": "ASSIGNMENT_DEADLINE",
      "id": "uuid",
      "title": "string",
      "date": null,
      "dueAt": "ISO-8601",
      "classId": "uuid",
      "className": "string"
    }
  ]
}
```

---

## 20) Frontend Integration Notes

- Store access token from `/auth/login` and send in all authenticated requests.
- Use a global API interceptor to unwrap envelope `data.data`.
- Handle `401` (redirect login), `403` (permission UI), `422/400` (validation mapping from `errors[]`).
- Use enums as strict unions in frontend types to avoid invalid status/role bugs.
- Dashboard/report payloads are nested and large; type them explicitly before UI coding.

---

## 21) Quick Endpoint Index

- Auth: 4 endpoints
- Users/Profile: 9 endpoints (`PATCH /me`, user activity logs added)
- Classes: 14 endpoints (student code + student export added)
- Lessons: 5 endpoints
- Materials: 6 endpoints
- Assignments: 13 endpoints (progress added)
- Submissions: 6 endpoints
- Grading: 5 endpoints (bulk grade added)
- Notifications: 6 endpoints (unread count + read all added)
- Dashboard: 3 endpoints
- Activity: 2 endpoints
- Reports: 4 endpoints (CSV exports added)
- Files: 3 endpoints (metadata added)
- Attendance: 5 endpoints
- Calendar: 1 endpoint

Total: **86 endpoints**
