# PROMPT FOR OPUS 4.8 — Implement Missing APIs

# PROMPT: Implement All Missing Backend APIs (1-shot for Opus 4.8)

> Paste this entire prompt into Claude 4.8 (Opus) or any high-context coding model. It contains the full context needed to implement every missing API in one go.
> 

---

## CONTEXT

You are working on **HOA NOBITA Korean Platform** — an internal LMS backend. The backend already has **69 working endpoints**. You need to implement **all missing endpoints** (P0 + P1) based on the gap analysis below. The existing codebase follows REST conventions, uses JWT auth, and returns standardized envelopes.

### Design Decisions (DO NOT CHANGE)

- **Auth: Login ONLY.** No register, no forgot password, no refresh token. Admin (TEACHER_OWNER) creates all users. JWT token is long-lived (30 days or no expiry — configured at backend, no refresh endpoint needed).
- **Response envelope:** Every JSON response wraps in `{ success: true/false, message: "...", data: {...}, errors: null }`
- **RBAC:** TEACHER_OWNER (full access), CLASS_ADMIN (scoped to assigned classes only), STUDENT (own data only). Enforce at middleware level.

---

## EXISTING API (69 endpoints — do NOT modify these)

**Auth:** `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password`, `POST /auth/logout`

**Users (7):** `GET /users`, `POST /users`, `GET /users/{id}`, `GET /users/{id}/progress`, `PATCH /users/{id}`, `PATCH /users/{id}/status`, `DELETE /users/{id}`

**Classes (12):** `GET /classes`, `POST /classes`, `GET /classes/{id}`, `PATCH /classes/{id}`, `DELETE /classes/{id}`, `POST /classes/{id}/admins`, `DELETE /classes/{id}/admins/{adminId}`, `GET /classes/{id}/students`, `POST /classes/{id}/students`, `POST /classes/{id}/students/bulk`, `DELETE /classes/{id}/students/{studentId}`, `PATCH /classes/{id}/students/{studentId}/status`, `GET /classes/{id}/stats`

**Lessons (5):** `GET /classes/{id}/lessons`, `POST /classes/{id}/lessons`, `GET /lessons/{id}`, `PATCH /lessons/{id}`, `DELETE /lessons/{id}`

**Materials (6):** `GET /classes/{id}/materials`, `POST /classes/{id}/materials`, `GET /materials/{id}`, `PATCH /materials/{id}`, `DELETE /materials/{id}`, `PATCH /materials/{id}/visibility`

**Assignments (12):** `GET /classes/{id}/assignments`, `GET /assignments`, `POST /classes/{id}/assignments`, `GET /assignments/{id}`, `PATCH /assignments/{id}`, `DELETE /assignments/{id}`, `PATCH /assignments/{id}/publish`, `PATCH /assignments/{id}/close`, `POST /assignments/{id}/copy`, `GET /assignments/{id}/missing-students`, `POST /assignments/{id}/send-reminder`, `POST /classes/{id}/assignments/send-reminders`

**Submissions (6):** `GET /assignments/{id}/submissions`, `POST /assignments/{id}/submissions`, `GET /submissions/{id}`, `PATCH /submissions/{id}`, `DELETE /submissions/{id}`, `GET /me/submissions`

**Grading (4):** `GET /classes/{id}/grading/submissions`, `POST /submissions/{id}/grade`, `PATCH /grades/{id}`, `POST /submissions/{id}/request-resubmit`

**Notifications (4):** `GET /notifications`, `POST /notifications`, `DELETE /notifications/{id}`, `POST /notifications/{id}/read`

**Dashboard (3):** `GET /dashboard/teacher`, `GET /dashboard/admin`, `GET /dashboard/student`

**Activity (2):** `GET /activity/recent`, `GET /classes/{id}/activity`

**Reports (2):** `GET /reports/system`, `GET /reports/classes/{id}`

**Files (2):** `POST /files/upload`, `GET /files/{id}/download`

---

## EXISTING ENUMS & DATA SHAPES

Use these exact values:

- `RoleName`: TEACHER_OWNER, CLASS_ADMIN, STUDENT
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED
- `ClassStatus`: DRAFT, ACTIVE, COMPLETED, ARCHIVED
- `LessonStatus`: DRAFT, PUBLISHED
- `AssignmentStatus`: DRAFT, PUBLISHED, CLOSED
- `SubmissionStatus`: SUBMITTED, LATE, GRADED, RESUBMIT_REQUESTED
- `TargetType`: CLASS, USER, ALL (for notifications; ROLE is NOT yet in enum — use CLASS/ALL instead for now)
- `MemberStatus`: ACTIVE, PAUSED, REMOVED

**Key existing response shapes:**

- `UserResponse`: id, fullName, email, phone, status, firstLogin, avatarUrl, note, roles[], createdAt, temporaryPassword
- `ClassResponse`: id, name, code, description, levelFrom, levelTo, status, teacherId, teacherName, startDate, endDate, studentCount, admins[], createdAt
- `ClassStatsResponse`: classId, totalStudents, totalAssignments, totalSubmissions, missingSubmissions, lateSubmissions, gradedSubmissions, needGrading, submissionRate, averageScore
- `StudentMemberResponse`: id, fullName, email, status, joinedAt
- `LessonResponse`: id, classId, title, description, lessonDate, orderIndex, status, createdAt
- `MaterialResponse`: id, classId, lessonId, fileId, title, description, externalUrl, visible, createdAt
- `AssignmentResponse`: id, classId, className, lessonId, title, description, instruction, dueAt, maxScore, status, allowResubmit, createdAt
- `SubmissionResponse`: id, assignmentId, assignmentTitle, className, studentId, studentName, contentText, contentUrl, fileId, status, submittedAt, gradeId, score, maxScore, feedback
- `GradeResponse`: id, submissionId, score, feedback, gradedBy, gradedAt
- `NotificationResponse`: id, title, content, targetType, targetId, createdBy, createdAt, isRead, readAt
- `ActivityResponse`: id, actionType, targetType, targetId, targetName, actorId, actorName, classId, message, createdAt
- `UploadResponse`: id, originalFileName, contentType, fileSize

---

## IMPLEMENTATION TASK: ALL MISSING APIs (P0 + P1)

Implement **all** of the following endpoints following the existing codebase patterns (same envelope, same auth, same RBAC middleware). Use the existing schema/entities.

### P0 — CRITICAL (must implement first, frontend cannot work without these)

#### 1. Pagination + Query Params on ALL GET list endpoints

Add query param support to every existing GET list endpoint:

```
?page=1&size=20&sort=createdAt,desc&search=keyword&status=ACTIVE&classId=uuid
```

Endpoints affected: `GET /users`, `GET /classes`, `GET /classes/{id}/students`, `GET /classes/{id}/lessons`, `GET /classes/{id}/materials`, `GET /classes/{id}/assignments`, `GET /assignments`, `GET /assignments/{id}/submissions`, `GET /me/submissions`, `GET /notifications`, `GET /classes/{id}/grading/submissions`, `GET /activity/recent`, `GET /classes/{id}/activity`.

Return paginated envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [...],
    "page": 1,
    "size": 20,
    "totalItems": 100,
    "totalPages": 5
  },
  "errors": null
}
```

#### 2. File Metadata Endpoint

```
GET /files/{id}
→ { id, originalFileName, contentType, fileSize, createdAt?, createdBy? }
```

#### 3. Notification Unread Count & Bulk Read

```
GET /notifications/unread-count
→ { "count": 5 }

POST /notifications/read-all
→ marks all notifications for current user as read
→ returns updated count or success message
```

#### 4. Self-Update Profile

```
PATCH /me
Body: { fullName?, phone?, avatarUrl? }
→ updates current authenticated user
→ returns UserResponse (without temporaryPassword unless admin)
```

#### 5. Assignment Progress Endpoint

```
GET /assignments/{id}/progress
→ {
  assignmentId,
  totalStudents,
  submittedCount,
  missingCount,
  lateCount,
  gradedCount,
  needGradingCount
}
```

### P1 — IMPORTANT (for Phase 2 features)

#### 6. Attendance Module (5 endpoints)

Database schema to add (if not exists): `attendance(id, lessonId, studentId, status [PRESENT, ABSENT, LATE], note, createdBy, createdAt)`

```
GET /classes/{id}/attendance/summary
→ returns attendance summary for class: { classId, totalLessons, attendanceRate, studentAttendance[] }

POST /lessons/{id}/attendance
Body: { records: [{ studentId, status: "PRESENT|ABSENT|LATE", note? }] }
→ bulk mark attendance for a lesson
→ returns created/updated records

GET /lessons/{id}/attendance
→ returns attendance records for this lesson with student info

GET /students/{id}/attendance
→ returns attendance history for a student (across all classes they are in)
→ restricted: student sees self, admin sees their class students, teacher sees all

PATCH /attendance/{id}
Body: { status?, note? }
→ update a single attendance record
```

#### 7. Calendar/Schedule Aggregation

```
GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&classId=uuid
→ returns combined events from lessons and assignment deadlines in that date range:
{
  events: [
    { type: "LESSON", id, title, date, classId, className },
    { type: "ASSIGNMENT_DEADLINE", id, title, dueAt, classId, className }
  ]
}
→ role-scoped: student only sees their classes, admin only sees assigned classes, teacher sees all
```

#### 8. Export APIs

```
GET /reports/classes/{id}/export?format=csv
→ returns CSV download stream of class report data

GET /reports/system/export?format=csv
→ returns CSV download stream of system report data

GET /classes/{id}/students/export?format=csv
→ returns CSV download stream of student list with columns: studentCode, fullName, email, status, joinedAt
```

#### 9. Student Code Management

```
PATCH /classes/{id}/students/{studentId}/code
Body: { studentCode: "C01" }
→ returns updated StudentMemberResponse with studentCode field added
```

#### 10. User Activity Logs

```
GET /users/{id}/activity-logs
→ returns ActivityResponse[] for a specific user (paginated, same query params)
→ restricted: student sees self, admin sees their class students, teacher sees all
```

#### 11. Bulk Grade

```
POST /assignments/{id}/submissions/bulk-grade
Body: { grades: [{ submissionId, score, feedback? }] }
→ grades multiple submissions at once
→ returns summary: { gradedCount, failedCount, errors[] }
```

---

## IMPLEMENTATION RULES

1. **Reuse existing middleware** for auth (`Authorization: Bearer <token>`) and RBAC checks.
2. **Reuse existing response envelope** pattern: `{ success, message, data, errors }`.
3. **Reuse existing enum values** — do not invent new ones. If something needs a new status, check existing enums first.
4. **Pagination:** Default `page=1`, `size=20`. Max `size=100`. Sort format: `field,asc` or `field,desc`. Search should be case-insensitive LIKE on name/title fields.
5. **RBAC enforcement:**
    - TEACHER_OWNER: all access
    - CLASS_ADMIN: only classes where they are in class_admins table. For `GET /classes`, only return assigned. For `GET /classes/{id}/...`, verify admin assignment. For `GET /notifications`, only return notifications targeting their classes.
    - STUDENT: only self-owned data (own submissions, own classes, own notifications).
6. **Database:** Use existing schema. Add `attendance` table if not exists. Add `studentCode` field to `class_students` if not exists.
7. **File upload validation:** Add server-side validation: max 10MB, accept PDF, DOC, DOCX, PNG, JPG, MP4. Return 400 with validation error if invalid.
8. **Soft delete:** For `DELETE` endpoints, if currently hard-deleting, consider adding soft delete (status = ARCHIVED/DELETED) for classes and assignments to preserve data. But follow existing pattern if already hard-delete.
9. **Error format:** `errors: [{ field: "...", message: "..." }]` for validation errors. `message` string for general errors.

---

## DELIVERABLE

Return the complete implementation code for all missing endpoints. Organize by module (Auth, Users, Classes, Lessons, Materials, Assignments, Submissions, Grading, Notifications, Dashboard, Activity, Reports, Files, Attendance, Calendar). Include:

- Controller/Handler methods
- Service/Repository logic (or whatever pattern the existing codebase uses)
- DTO/Request/Response classes if applicable
- Any new entity/model definitions needed (attendance, studentCode)

Do not reimplement the existing 69 endpoints. Only implement what is listed above as missing.