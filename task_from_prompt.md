The previous frontend felt boring and incomplete. I want a real product-grade rebuild: dashboard must become an operation center, class detail must become the main class management workspace, and every backend API must have a real screen/form/workflow. Do not stop at “build passed”.
You are Opus Thinking acting as a Senior Full-stack Engineer, Solution Architect, Product Designer, UX Auditor, QA Engineer, DevOps Engineer, and Technical Lead.

You must implement the Hoà Nobita Korean Platform end-to-end.

This is not a toy demo.
This is not a CRUD scaffold.
This is not a static dashboard.
This is not a frontend shell.

You must build a real local product with:

- Real backend
- Real PostgreSQL database
- Real Flyway migrations
- Real REST APIs
- Real JWT authentication
- Real role-based access control
- Real dashboard analytics APIs
- Real frontend pages
- Real forms
- Real API integration
- Real charts using real/derived data
- Real demo data
- Real test scripts
- Real backend tests
- Real frontend typecheck/lint/build
- Real QA documentation
- Real build verification

You must code, run, test, fix, and repeat until everything passes.

Do not stop after generating files.
Do not stop after build fails.
Do not say “you can run”.
You must run the commands yourself, inspect errors, fix them, and re-run.

If an existing project already exists, do not blindly rewrite everything.
First audit the current repo, understand what exists, then improve it safely.

Project path:

/Users/wongun78/Vault/projects/hoa-nobita-system

Product name:

Hoà Nobita Korean Platform

Domain:

A Korean language / TOPIK class management and learning platform.

Main users:

1. TEACHER_OWNER
2. CLASS_ADMIN
3. STUDENT

Default UI language:

Vietnamese with full accents.

Secondary locale:

Korean.

Design direction:

Korean Clean Blue Learning System.

==================================================
0. WORKFLOW YOU MUST FOLLOW
==================================================

Follow these phases strictly:

Phase 1 — Audit current repository
Phase 2 — Backend domain and permission audit
Phase 3 — Backend gaps implementation
Phase 4 — Dashboard analytics backend
Phase 5 — Frontend API inventory
Phase 6 — Frontend architecture rebuild
Phase 7 — Feature pages implementation
Phase 8 — Dashboard UX upgrade
Phase 9 — Forms, mutations, validation
Phase 10 — Demo data and test scripts
Phase 11 — QA docs
Phase 12 — Full verification
Phase 13 — Fix loop
Phase 14 — Final report

You must maintain a task.md file.

task.md must include:

- Backend gaps
- Frontend gaps
- API inventory
- Permission matrix
- Dashboard analytics checklist
- Page checklist
- Form checklist
- Test checklist
- Commands run
- Pass/fail results
- Known limitations

Do not code blindly.
Read existing backend controllers, DTOs, entities, repositories, services, frontend src, scripts/test-api.sh, scripts/seed-demo-data.sh, README.md first.

==================================================
1. PRODUCT CONTEXT
==================================================

Hoà Nobita Korean Platform is a class management and learning system for Korean/TOPIK classes.

Core domains:

- User management
- Class management
- Class admins
- Class members
- Lessons
- Materials
- File upload/download metadata
- Assignments
- Submissions
- Grading
- Notifications
- Dashboard analytics
- Student performance
- Class health
- Admin workload
- Risk student detection
- Today action list
- Demo data
- QA/testing

Primary product goal:

The teacher/admin must be able to operate real TOPIK classes from the system.

The dashboard must not only show counts.
It must answer:

- What needs attention today?
- Which classes are unhealthy?
- Which assignments are due soon?
- Which submissions need grading?
- Which students need support?
- Which admins/classes have workload?
- Which learning quality issues exist?

==================================================
2. TECH STACK — MANDATORY
==================================================

Backend:

- Java 21
- Spring Boot 3.x
- Spring Security
- JWT Authentication
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- Jakarta Bean Validation
- OpenAPI / Swagger
- JUnit 5
- Mockito
- Testcontainers if useful
- Clean service/controller/repository separation

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Recharts or equivalent chart library
- Lucide React if useful
- shadcn-style local components or clean custom UI components

Database:

- PostgreSQL
- UUID primary keys
- Soft delete for important records
- Audit fields

DevOps:

- Docker
- docker-compose
- GitHub Actions
- README
- API test scripts
- Demo seed scripts

Testing:

- Backend unit tests
- Backend integration tests where feasible
- Bash API test script with curl + jq
- Frontend typecheck
- Frontend lint
- Frontend build
- Manual smoke checklist

==================================================
3. BACKEND ARCHITECTURE
==================================================

Use modular monolith.

Do NOT use microservices.

Backend package root:

src/main/java/com/hoanobita/topikplatform

Expected modules:

com.hoanobita.topikplatform
├── auth
├── user
├── classroom
├── lesson
├── material
├── assignment
├── submission
├── grading
├── notification
├── file
├── dashboard
├── activity
└── common

Each domain module should generally contain:

- controller
- service
- repository
- entity
- dto
- mapper if useful
- exception if useful

Common module should include:

- BaseEntity
- ApiResponse
- PageResponse
- ErrorResponse
- GlobalExceptionHandler
- SecurityUtils
- PermissionService
- Auditing config
- Constants
- Common exceptions

Backend rules:

- Controllers thin
- Services contain business logic
- Repositories query only
- DTOs only
- Never expose password hash
- Global exception handling
- Consistent response format
- Validation everywhere
- Permissions enforced in backend
- Transactions where needed
- Soft delete important entities
- No fake data in API
- Dashboard APIs must respect role scope

==================================================
4. FRONTEND ARCHITECTURE
==================================================

Frontend must be feature-based.

Required structure:

frontend/src/
  app/
    router.tsx
    providers.tsx
  components/
    layout/
      app-shell.tsx
      sidebar.tsx
      topbar.tsx
      app-logo.tsx
      language-toggle.tsx
      user-menu.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
      textarea.tsx
      select.tsx
      badge.tsx
      table.tsx
      dialog.tsx
      modal.tsx
      tabs.tsx
      dropdown-menu.tsx
      skeleton.tsx
      alert.tsx
      toast.tsx
    system/
      page-header.tsx
      stat-card.tsx
      metric-card.tsx
      trend-card.tsx
      chart-card.tsx
      data-card.tsx
      data-table.tsx
      status-badge.tsx
      role-badge.tsx
      score-badge.tsx
      risk-badge.tsx
      empty-state.tsx
      loading-state.tsx
      error-state.tsx
      form-section.tsx
      deadline-pill.tsx
      confirm-dialog.tsx
      quick-action-grid.tsx
      task-list-card.tsx
      class-health-card.tsx
      risk-student-card.tsx
      recent-activity-timeline.tsx
      submission-rate-bar.tsx
  features/
    auth/
      api.ts
      hooks.ts
      types.ts
      auth-provider.tsx
      auth-context.ts
      use-auth.ts
      route-guards.tsx
    users/
      api.ts
      hooks.ts
      types.ts
      components/
    classes/
      api.ts
      hooks.ts
      types.ts
      components/
    lessons/
      api.ts
      hooks.ts
      types.ts
      components/
    materials/
      api.ts
      hooks.ts
      types.ts
      components/
    assignments/
      api.ts
      hooks.ts
      types.ts
      components/
    submissions/
      api.ts
      hooks.ts
      types.ts
      components/
    grading/
      api.ts
      hooks.ts
      types.ts
      components/
    notifications/
      api.ts
      hooks.ts
      types.ts
      components/
    files/
      api.ts
      hooks.ts
      types.ts
      components/
    dashboard/
      api.ts
      hooks.ts
      types.ts
      components/
    activity/
      api.ts
      hooks.ts
      types.ts
      components/
  i18n/
    locales/
      vi.ts
      ko.ts
    i18n-provider.tsx
    i18n-context.ts
    use-i18n.ts
    types.ts
  lib/
    api.ts
    query-keys.ts
    utils.ts
    errors.ts
    constants.ts
    permissions.ts
    date.ts
  pages/
    login-page.tsx
    change-password-page.tsx
    dashboard-page.tsx
    users-page.tsx
    user-detail-page.tsx
    classes-page.tsx
    class-detail-page.tsx
    lessons-page.tsx
    lesson-detail-page.tsx
    materials-page.tsx
    material-detail-page.tsx
    assignments-page.tsx
    assignment-detail-page.tsx
    assignment-submissions-page.tsx
    submission-detail-page.tsx
    grading-page.tsx
    my-submissions-page.tsx
    notifications-page.tsx
    reports-page.tsx
    forbidden-page.tsx
    not-found-page.tsx

Rules:

- Do not put everything in App.tsx.
- Do not create one giant core.tsx.
- Do not leave placeholder pages.
- Do not leave fake buttons.
- Do not use fake stats when backend data exists.
- Use feature API/hook/type structure.
- Every visible action must work, be disabled with explanation, or be removed.

==================================================
5. ROLES AND PERMISSIONS
==================================================

Mandatory roles:

- TEACHER_OWNER
- CLASS_ADMIN
- STUDENT

==================================================
5.1 TEACHER_OWNER — Giảng viên / Chủ platform
==================================================

This is the highest role.

TEACHER_OWNER can:

- Manage all users
- Create/edit/delete/soft-delete users
- Suspend/activate users
- Create/edit/delete/archive classes
- Assign admins to classes
- Remove admins from classes
- Assign students to classes
- Remove students from classes
- Update student membership status
- Manage all lessons
- Manage all materials
- Upload/download files
- Toggle material visibility
- Manage all assignments
- Create/edit/publish/close/copy/delete assignments
- View all submissions
- Grade all submissions
- Update grades
- Request resubmission
- Send notifications to all/class/user/role if supported
- View global dashboard
- View all class performance
- View all student performance
- View operation metrics:
  - active classes
  - classes ending soon
  - classes missing submissions
  - classes needing grading
  - admin/class workload
  - learning quality
- View risk students
- View class health
- View dashboard analytics across platform

TEACHER_OWNER must see global data.

==================================================
5.2 CLASS_ADMIN — Admin quản lý lớp
==================================================

CLASS_ADMIN can only operate inside assigned classes.

CLASS_ADMIN can:

- View assigned classes only
- Manage students in assigned classes
- Add/remove students in assigned classes if backend policy allows
- Update membership status in assigned classes
- Create/edit/delete lessons in assigned classes
- Create/edit/delete materials in assigned classes
- Toggle material visibility in assigned classes
- Create/edit/delete/publish/close/copy assignments in assigned classes
- View submissions in assigned classes
- Grade submissions in assigned classes if allowed
- Request resubmission in assigned classes
- Send notifications to assigned classes
- View dashboard limited to assigned classes
- View class health for assigned classes
- View risk students only in assigned classes
- View grading workload only in assigned classes

CLASS_ADMIN must NOT:

- Manage all users globally
- View unassigned classes
- Access submissions from unassigned classes
- Assign admins globally
- Delete global data
- Send global ALL notification unless explicitly allowed
- See global teacher-only dashboards

Backend must enforce all restrictions.
Frontend must hide/disable unauthorized UI.

==================================================
5.3 STUDENT — Học viên
==================================================

STUDENT can:

- Login
- Change password
- View own dashboard
- View joined classes only
- View visible materials in joined classes
- View published/closed assignments in joined classes
- Submit assignment when assignment is PUBLISHED/open
- View own submissions
- Edit/delete own submission only if backend allows
- View own grades/feedback
- View own notifications
- View resubmit requests

STUDENT must NOT:

- Access user management
- Access admin pages
- Access unjoined classes
- View hidden materials
- View draft assignments
- View other students’ submissions
- Grade
- Create lessons/materials/assignments/notifications
- Access grading center

Backend and frontend must both enforce this.

==================================================
6. AUTH REQUIREMENTS
==================================================

Auth APIs:

POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
POST /api/v1/auth/logout

Login:

- identifier: email or phone
- password

JWT:

- Access token may be returned in JSON for MVP
- Frontend can store token locally for MVP
- Add comment/docs that production should prefer HttpOnly Secure Cookie

First login flow:

Teacher/Admin creates student
→ backend generates temporary password
→ response returns temporaryPassword in local/dev
→ student logs in
→ if firstLogin = true, frontend redirects to /change-password
→ student changes password
→ firstLogin = false
→ student accesses dashboard

Suspended/inactive users cannot login.

==================================================
7. API RESPONSE FORMAT
==================================================

Success:

{
  "success": true,
  "message": "OK",
  "data": ...
}

Error:

{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}

Pagination:

{
  "success": true,
  "message": "OK",
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}

HTTP statuses:

- 200 OK
- 201 Created
- 400 Validation/business error
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 409 Conflict

Frontend must parse this consistently.

==================================================
8. DATABASE SCHEMA REQUIREMENTS
==================================================

Use PostgreSQL + Flyway.

Use UUID PKs.

Important tables must include:

- created_at
- updated_at
- created_by
- updated_by
- deleted_at where applicable

Soft delete for:

- users
- classes
- lessons
- materials
- assignments
- submissions

Core tables:

- users
- roles
- user_roles
- classes
- class_admins
- class_members
- lessons
- files
- materials
- assignments
- submissions
- grades
- notifications
- notification_reads optional
- activity_logs
- dashboard snapshots optional

Do not store binary files in DB.
Store file metadata in DB.
Store local file under backend/uploads or equivalent.

==================================================
9. REQUIRED BACKEND REST API
==================================================

Implement/verify these APIs.

Auth:

POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/change-password
POST /api/v1/auth/logout

Users:

GET /api/v1/users
POST /api/v1/users
GET /api/v1/users/{id}
PATCH /api/v1/users/{id}
PATCH /api/v1/users/{id}/status
DELETE /api/v1/users/{id}

Classes:

GET /api/v1/classes
POST /api/v1/classes
GET /api/v1/classes/{classId}
PATCH /api/v1/classes/{classId}
DELETE /api/v1/classes/{classId}

POST /api/v1/classes/{classId}/admins
DELETE /api/v1/classes/{classId}/admins/{adminId}

POST /api/v1/classes/{classId}/students
DELETE /api/v1/classes/{classId}/students/{studentId}
PATCH /api/v1/classes/{classId}/students/{studentId}/status

Lessons:

GET /api/v1/classes/{classId}/lessons
POST /api/v1/classes/{classId}/lessons
GET /api/v1/lessons/{lessonId}
PATCH /api/v1/lessons/{lessonId}
DELETE /api/v1/lessons/{lessonId}

Files:

POST /api/v1/files/upload
GET /api/v1/files/{fileId}/download

Materials:

GET /api/v1/classes/{classId}/materials
POST /api/v1/classes/{classId}/materials
GET /api/v1/materials/{materialId}
PATCH /api/v1/materials/{materialId}
DELETE /api/v1/materials/{materialId}
PATCH /api/v1/materials/{materialId}/visibility

Assignments:

GET /api/v1/classes/{classId}/assignments
GET /api/v1/assignments
POST /api/v1/classes/{classId}/assignments
GET /api/v1/assignments/{assignmentId}
PATCH /api/v1/assignments/{assignmentId}
PATCH /api/v1/assignments/{assignmentId}/publish
PATCH /api/v1/assignments/{assignmentId}/close
DELETE /api/v1/assignments/{assignmentId}
POST /api/v1/assignments/{assignmentId}/copy

Submissions:

GET /api/v1/assignments/{assignmentId}/submissions
POST /api/v1/assignments/{assignmentId}/submissions
GET /api/v1/submissions/{submissionId}
PATCH /api/v1/submissions/{submissionId}
DELETE /api/v1/submissions/{submissionId}
GET /api/v1/me/submissions

Grading:

GET /api/v1/classes/{classId}/grading/submissions
POST /api/v1/submissions/{submissionId}/grade
PATCH /api/v1/grades/{gradeId}
POST /api/v1/submissions/{submissionId}/request-resubmit

Notifications:

GET /api/v1/notifications
POST /api/v1/notifications
DELETE /api/v1/notifications/{notificationId}

==================================================
10. NEW BACKEND DASHBOARD / ANALYTICS API
==================================================

Add dashboard APIs if missing.

These APIs are important because frontend should not make dozens of calls and duplicate business rules.

==================================================
10.1 Teacher Dashboard API
==================================================

Endpoint:

GET /api/v1/dashboard/teacher

Role:

TEACHER_OWNER only.

Return a DTO with:

Hero summary:

- currentDate
- greetingName
- todayActionCount
- activeClassCount
- activeStudentCount
- needGradingCount
- overdueMissingSubmissionCount

KPI:

classes:
- total
- active
- completed
- draft
- archived
- upcoming

students:
- total
- active
- suspended
- inactive
- newLast7Days
- newLast30Days
- unassigned

assignments:
- total
- draft
- published
- closed
- dueSoon48h
- overdue

submissions:
- submitted
- missing
- late
- needGrading
- graded
- resubmitRequested

grading:
- waiting
- averageScore
- passRate
- improvementRate

materials:
- total
- visible
- hidden
- newRecently

notifications:
- sentLast7Days
- globalCount
- classCount

Charts:

- classStatusChart
  - ACTIVE
  - DRAFT / UPCOMING
  - COMPLETED
  - ARCHIVED

- submissionRateByClass
  - classId
  - className
  - submitted
  - missing
  - late

- needGradingByClass
  - classId
  - className
  - count

- averageScoreByClass
  - classId
  - className
  - averageScore
  - maxScoreAverage

- gradeDistribution
  - range 0-40
  - range 40-60
  - range 60-80
  - range 80-100

- assignmentWorkflow
  - draft
  - published
  - closed
  - overdue
  - needGrading

Do NOT implement student growth chart for now.
Do NOT implement activity heatmap for now.

Today tasks:

Return list of action items:

- id
- type
- title
- description
- priority: HIGH / MEDIUM / LOW
- targetUrl
- ctaLabel

Examples:

- “12 bài nộp đang chờ chấm”
- “5 bài tập sắp hết hạn trong 48 giờ”
- “8 học viên chưa nộp bài”
- “3 tài liệu đang để ẩn”
- “2 lớp chưa có buổi học nào”
- “4 submissions được yêu cầu nộp lại”
- “6 học viên chưa thuộc lớp nào”

Class health list:

- classId
- className
- studentCount
- adminNames
- openAssignmentCount
- submissionRate
- needGradingCount
- averageScore
- status
- issues
- actionUrl

Assignments due soon:

- assignmentId
- title
- classId
- className
- deadline
- status
- submittedCount
- totalStudents
- lateCount
- needGradingCount
- actionUrl

Risk students:

- studentId
- fullName
- email
- phone
- classId
- className
- submissionRate
- averageScore
- issue
- riskLevel
- actionUrl

Recent activity:

If ActivityLog exists, use it.
If not, derive from recent assignments, submissions, grades, notifications, materials, lessons.

Return:

- id
- type
- message
- actorName
- targetName
- createdAt
- targetUrl

==================================================
10.2 Admin Dashboard API
==================================================

Endpoint:

GET /api/v1/dashboard/admin

Role:

CLASS_ADMIN only.

Scope:

Assigned classes only.

Return:

Welcome summary:

- assignedClassCount
- todayNeedGradingCount
- dueSoonAssignmentCount
- missingSubmissionCount

KPI:

classes:
- assignedTotal
- active

students:
- totalInAssignedClasses
- active
- suspended

assignments:
- published
- closed
- dueSoon48h
- overdue

submissions:
- submitted
- missing
- needGrading
- late

scores:
- averageScore
- belowThresholdStudentCount

Charts:

- submissionRateByAssignedClass
- needGradingByAssignedClass
- averageScoreByAssignedClass
- activeSuspendedStudentRatio
- assignmentStatusInAssignedClasses

Today tasks:

- Need grading in assigned classes
- Missing submissions in assigned classes
- Assignments due soon
- Hidden materials
- Lessons without materials
- Resubmit requested submissions

Admin must NOT receive global teacher-only data.

==================================================
10.3 Student Dashboard API
==================================================

Endpoint:

GET /api/v1/dashboard/student

Role:

STUDENT only.

Return:

- joinedClassCount
- openAssignmentCount
- dueSoonCount
- submittedCount
- gradedCount
- resubmitRequestedCount
- latestFeedback
- upcomingAssignments
- recentMaterials
- notifications
- ownSubmissionStats

==================================================
10.4 Activity Log API
==================================================

Add if feasible.

Entity:

ActivityLog
- id
- actorId
- actorName
- actionType
- targetType
- targetId
- classId nullable
- message
- createdAt

Use for:

- dashboard recent activity
- class detail timeline
- user detail history
- audit trail

Endpoints:

GET /api/v1/activity/recent
GET /api/v1/classes/{classId}/activity

Permission scoped by role.

If ActivityLog is too large for current phase, implement derived recentActivity in dashboard service and document ActivityLog as future enhancement.

==================================================
11. DASHBOARD UX REQUIREMENTS
==================================================

==================================================
11.1 TEACHER_OWNER Dashboard
==================================================

This must be the strongest screen.

Do not show only a few cards.

Required blocks:

A. Hero / Welcome Summary

- “Chào Anh Hoà, hôm nay có X việc cần xử lý”
- Current date
- Short summary:
  - Active classes
  - Active students
  - Need grading count
  - Overdue/missing submission count
- Quick actions:
  - Tạo lớp
  - Tạo bài tập
  - Gửi thông báo
  - Thêm học viên
  - Tạo buổi học

Goal:

Teacher should immediately know what needs attention today.

B. KPI Cards

Show these KPI groups:

1. Classes
- Total classes
- Active
- Completed
- Upcoming/Draft

2. Students
- Active
- Suspended
- New last 7/30 days
- Unassigned students

3. Assignments
- Total
- Draft
- Published
- Closed
- Due soon
- Overdue

4. Submissions
- Submitted
- Missing
- Late
- Need grading
- Graded
- Resubmit requested

5. Grading
- Waiting
- Average score
- Pass rate
- Improvement rate

6. Materials
- Total
- Visible
- Hidden
- Recent materials

7. Notifications
- Sent last 7 days
- Global notifications
- Class notifications

C. Charts

Implement charts with Recharts or equivalent.

Include:

1. Class status chart
Type: Donut/Pie chart
Statuses:
- Active
- Draft/Upcoming
- Completed
- Archived

2. Submission rate by class
Type: Bar/stacked bar
Data:
- Submitted
- Missing
- Late

3. Need grading by class
Type: Horizontal bar chart

4. Average score by class
Type: Bar chart

5. Grade distribution
Type: Histogram/bar
Ranges:
- 0–40%
- 40–60%
- 60–80%
- 80–100%

6. Assignment workflow chart
Type: Donut/stacked status
Statuses:
- Draft
- Published
- Closed
- Overdue
- Need grading

Do NOT implement student growth chart now.
Do NOT implement activity heatmap now.

D. “Việc cần xử lý hôm nay”

Very important.

Show task list with:

- Icon
- Priority
- Title
- Description
- Link to handling screen
- CTA:
  - Chấm ngay
  - Xem lớp
  - Gửi nhắc nhở
  - Xem bài tập
  - Xem học viên

Examples:

- 12 bài nộp đang chờ chấm
- 5 bài tập sắp hết hạn trong 48 giờ
- 8 học viên chưa nộp bài
- 3 tài liệu đang để ẩn
- 2 lớp chưa có buổi học nào
- 4 submissions được yêu cầu nộp lại
- 6 học viên chưa thuộc lớp nào

E. “Lớp cần chú ý” table

Columns:

- Tên lớp
- Số học viên
- Admin phụ trách
- Bài tập đang mở
- Tỷ lệ nộp bài
- Bài cần chấm
- Điểm trung bình
- Trạng thái
- Hành động

Highlight:

- Low submission rate
- Many ungraded submissions
- No recent lessons/materials

Do NOT include “Không có admin” as a main highlight if you decided to remove it.

F. “Bài tập sắp đến hạn” table

Columns:

- Tên bài tập
- Lớp
- Deadline
- Trạng thái
- Đã nộp / Tổng học viên
- Số nộp trễ
- Số cần chấm
- Hành động

G. “Học viên cần hỗ trợ” table

Criteria:

- Missing many assignments
- Low average score
- Multiple resubmission requests
- No recent activity
- Suspended

Columns:

- Học viên
- Lớp
- Email/SĐT
- Tỷ lệ nộp bài
- Điểm trung bình
- Vấn đề
- Hành động

H. Recent Activity

Use ActivityLog if implemented.
Otherwise derive from:

- New assignments
- New submissions
- New grades
- New notifications
- New materials
- New lessons

==================================================
11.2 CLASS_ADMIN Dashboard
==================================================

Admin dashboard must be scoped to assigned classes.

Required blocks:

A. Welcome Summary

- “Bạn đang quản lý X lớp”
- “Hôm nay có Y bài cần chấm”
- “Z bài tập sắp đến hạn”
- “N học viên chưa nộp bài”

B. KPI Cards

1. Assigned classes
- Total assigned
- Active classes

2. Students in assigned classes
- Total
- Active
- Suspended

3. Assignments
- Published
- Closed
- Due soon
- Overdue

4. Submissions
- Submitted
- Missing
- Need grading
- Late

5. Scores
- Average score by class
- Students below threshold

C. Charts

- Submission rate by assigned class
- Need grading by assigned class
- Average score by assigned class
- Active/suspended student ratio
- Assignment status in admin classes

D. “Việc cần xử lý”

Show only scoped tasks:

- Need grading in assigned classes
- Missing submissions
- Assignments due soon
- Hidden materials
- Lessons without materials
- Resubmit requested submissions

Admin must NOT see:

- Global user management
- Unassigned classes
- Global notification if not allowed
- Assign admin global

==================================================
11.3 STUDENT Dashboard
==================================================

Student dashboard should be simple and motivating.

Required blocks:

- My classes
- Assignments to submit
- Upcoming deadlines
- Latest grades/feedback
- Resubmit requests
- Recent materials
- Notifications

Do not show admin clutter.

==================================================
12. CORE MODULE REQUIREMENTS
==================================================

==================================================
12.1 Users Module
==================================================

For TEACHER_OWNER:

Required functions:

- List all users
- Create user
- Edit user
- View user detail
- Suspend/activate user
- Soft delete user
- Filter by role
- Filter by status
- Search by name/email/phone
- See user’s classes
- See student progress
- See submission history
- See average grade
- See unassigned students
- Bulk add students to class if feasible
- Bulk suspend/activate if feasible

Do NOT implement reset password if backend does not support it yet.
Do NOT implement export if not required.

For CLASS_ADMIN:

- View students in assigned classes
- Add students to assigned classes if backend allows
- Remove students from assigned classes
- Update membership status
- No global user management

Pages:

Users List Page:

- Search
- Role filter
- Status filter
- Table
- Create user dialog
- Status badge
- Role badge
- Actions dropdown

User Detail Page:

- Profile card
- Role/status
- Contact info
- Classes joined
- Assignment submissions
- Grades summary
- Recent submissions
- Admin actions

Student Progress Panel:

- Submission rate
- Average score
- Missing assignments
- Resubmit requested count
- Active classes

==================================================
12.2 Classes Module
==================================================

For TEACHER_OWNER:

- Create class
- Edit class
- Delete/archive class
- View all classes
- Assign admin
- Remove admin
- Add students
- Remove students
- Update student membership status
- View class stats
- View class quality
- View class workload
- View lessons/materials/assignments/submissions/grading

For CLASS_ADMIN:

- View assigned classes
- Manage content inside assigned classes
- Manage students in assigned classes if allowed
- No access to unassigned classes

Classes List Page:

- Header: “Lớp học”
- Quick stats:
  - Tổng lớp
  - Active classes
  - Tổng học viên
  - Bài cần chấm
- Search class
- Filter by status
- Filter by admin if available
- Sort by created/start date/student count if available
- Grid/card view and table view if feasible
- Create class button for teacher

Class card:

- Tên lớp
- Mã lớp
- Level
- Trạng thái
- Số học viên
- Admin phụ trách
- Số bài tập đang mở
- Tỷ lệ nộp bài gần nhất
- Bài cần chấm
- CTA: “Xem lớp”

Class Detail Page:

Header:

- Tên lớp
- Code
- Level
- Status
- Teacher
- Admins
- Student count
- Action buttons:
  - Sửa lớp
  - Gán admin
  - Thêm học viên
  - Tạo buổi học
  - Tạo bài tập
  - Gửi thông báo lớp

Class health cards:

- Submission rate
- Average score
- Need grading
- Students needing support
- Visible materials
- Open assignments

Tabs:

1. Tổng quan
2. Học viên
3. Buổi học
4. Tài liệu
5. Bài tập
6. Bài nộp
7. Chấm điểm
8. Thông báo lớp
9. Cài đặt lớp

Class Overview Tab:

- Submission rate by assignment chart
- Average score by assignment chart
- Need grading table
- Weak/missing students table
- Recent activity timeline
- Upcoming lessons
- Active assignments

Students Tab:

- Student table
- Search/filter
- Add student dialog
- Bulk add if feasible
- Status toggle
- Remove student
- Student progress mini-card

Columns:

- Học viên
- Email
- Phone
- Trạng thái trong lớp
- Số bài đã nộp
- Số bài chưa nộp
- Điểm trung bình
- Lần nộp gần nhất
- Hành động

Admins section:

- Admin list
- Assign admin dialog
- Remove admin
- Permission note

==================================================
12.3 Lessons Module
==================================================

Functions:

- List lessons by class
- Create lesson
- Edit lesson
- Delete lesson
- View lesson detail
- Order by orderIndex
- Show lesson timeline

Lessons Page / Tab:

- Timeline
- Lesson cards
- Create lesson dialog
- Edit lesson dialog
- Delete confirm

Lesson card:

- Tiêu đề
- “Buổi 01”, “Buổi 02”
- Ngày học
- Description
- Related materials if available
- Related assignments if available
- Status
- Actions

Empty state:

“Lớp này chưa có buổi học nào”

CTA:

“Tạo buổi học đầu tiên”

==================================================
12.4 Materials Module
==================================================

Functions:

- View materials by class
- Create material
- Edit material
- Delete material
- Toggle visible/hidden
- Upload file
- Download file
- Link material to lesson if backend supports
- Filter visible/hidden
- Search material

Materials Page / Tab:

- Material library
- Filters:
  - Tất cả
  - Đang hiển thị
  - Đang ẩn
- Search
- Upload material dialog
- Create external link material dialog
- Visibility toggle
- Preview/download button

Material card/table:

- Tên tài liệu
- Loại file/link
- Lesson liên quan
- Visible status
- Created by
- Created at
- Download/view
- Actions

Student:

- Sees only visible materials
- No edit/delete/toggle

Teacher/Admin:

- Sees visible and hidden
- Can toggle visibility

==================================================
12.5 Assignments Module
==================================================

This is a critical module.

Functions:

- Global assignment list
- Per-class assignment list
- Create assignment
- Edit assignment
- Publish assignment
- Close assignment
- Delete assignment
- Copy assignment
- View assignment detail
- View submissions
- View submission progress
- Filter by status
- Filter by class
- Filter by deadline
- Sort by deadline
- Highlight overdue

Assignments List Page:

- KPI:
  - Draft
  - Published
  - Closed
  - Due soon
  - Need grading
- Search
- Filter class
- Filter status
- Filter deadline
- Table/card layout
- Create assignment button

Assignment row/card:

- Tên bài
- Lớp
- Status
- Deadline
- Max score
- Đã nộp / Tổng học viên
- Cần chấm
- Late submissions
- Actions:
  - View
  - Edit
  - Publish
  - Close
  - Copy
  - Delete
  - View submissions

Assignment Detail Page:

Teacher/Admin:

- Assignment summary
- Status badge
- Deadline pill
- Description/instruction
- Submission progress
- Class info
- Edit
- Publish/Close
- Copy
- Delete
- View submissions
- Grade queue
- Send reminder if using notification flow

Student:

- Assignment info
- Deadline
- Max score
- Submit form if published/open
- Existing own submission
- Grade/feedback
- Resubmit request if any
- Cannot submit CLOSED assignment
- Cannot submit unjoined class assignment

Assignment Submissions Page:

Teacher/Admin only.

Summary:

- Total students
- Submitted
- Missing
- Late
- Graded
- Need grading

Filters:

- Chưa chấm
- Đã chấm
- Nộp trễ
- Cần nộp lại
- Chưa nộp

Table columns:

- Học viên
- Submitted at
- Late?
- Status
- Score
- Feedback
- Graded by
- Actions

Actions:

- View detail
- Grade
- Request resubmit

==================================================
12.6 Submissions Module
==================================================

Student functions:

- View own submissions
- Create submission
- Edit submission if allowed
- Delete submission if allowed
- View score
- View feedback
- View resubmit request

Teacher/Admin functions:

- View assignment/class submissions
- View submission detail
- Grade
- Request resubmit
- Update grade

My Submissions Page:

- Total submitted
- Graded count
- Resubmit requested count
- Late count
- Filter by class/status
- Submission cards/table

Submission card:

- Assignment name
- Class
- Submitted at
- Status
- Score
- Feedback preview
- CTA: View detail

Submission Detail Page:

- Assignment info
- Student info for teacher/admin
- Submission content
- Attached files if supported
- Submitted time
- Late status
- Grade card
- Feedback
- Resubmit request
- Action buttons

==================================================
12.7 Grading Module
==================================================

This screen should be strong.

Functions:

- Grading queue by class
- Filter submissions needing grading
- Quick grading
- View submission detail
- Update grade
- Request resubmit
- Filter by assignment/student/status
- Sort by submitted time/deadline
- Batch-style workflow if feasible

Grading Page:

- KPI:
  - Cần chấm
  - Đã chấm hôm nay
  - Nộp trễ
  - Cần nộp lại
  - Điểm trung bình
- Class selector
- Assignment selector
- Status filter
- Submission list
- Grading panel

Suggested layout:

Split view:

Left:
- Submission list

Right:
- Grading detail panel

Submission list item:

- Student
- Assignment
- Submitted at
- Late badge
- Current score
- Status

Grading panel:

- Submission content
- File attachments
- Score input
- Max score
- Feedback textarea
- Save grade
- Request resubmit
- Mark as reviewed if supported

==================================================
12.8 Notifications Module
==================================================

Functions:

- Send all notification
- Send class notification
- Send role notification if backend supports
- View sent notifications
- Delete notification
- Filter by target type
- Filter by class
- Reminder flow for missing submissions if feasible

Notifications Page:

- Create notification dialog
- Target type:
  - ALL
  - CLASS
  - ROLE if backend supports
  - USER if backend supports
- Title
- Content
- Notification history table

Table:

- Title
- Target
- Created by
- Created at
- Recipients if available
- Actions

Admin policy:

- Admin can send notification to assigned classes only
- Admin cannot send ALL unless backend explicitly allows

==================================================
12.9 Files Module
==================================================

Functions:

- Upload file
- Download file
- Attach file to material
- Attach file to submission if backend supports
- Show file metadata
- Validate file size/type
- Upload progress if feasible

UI:

- Drag & drop upload if feasible
- File picker
- File card
- File type icon
- Download button
- Upload error state

==================================================
13. FRONTEND ROUTES
==================================================

Implement real routes:

Public:

- /login

Protected:

- /dashboard
- /classes
- /classes/:classId
- /classes/:classId/lessons
- /classes/:classId/materials
- /classes/:classId/assignments
- /classes/:classId/grading
- /assignments
- /assignments/:assignmentId
- /assignments/:assignmentId/submissions
- /submissions/:submissionId
- /me/submissions
- /users
- /users/:userId
- /notifications
- /reports
- /change-password
- /forbidden
- * not found

Route rules:

- Unauthenticated users redirect to /login.
- firstLogin users redirect to /change-password.
- STUDENT cannot access /users.
- STUDENT cannot access grading/admin submission list pages.
- CLASS_ADMIN cannot access global teacher-only pages.
- Invalid permissions redirect to /forbidden.

==================================================
14. ROLE-BASED NAVIGATION
==================================================

Sidebar must be role-aware.

TEACHER_OWNER:

- Dashboard → /dashboard
- Lớp học → /classes
- Bài tập → /assignments
- Chấm bài → /classes or grading center
- Người dùng → /users
- Thông báo → /notifications
- Báo cáo → /reports if implemented

CLASS_ADMIN:

- Dashboard → /dashboard
- Lớp phụ trách → /classes
- Bài tập → /assignments
- Chấm bài → assigned class grading
- Thông báo → /notifications

STUDENT:

- Dashboard → /dashboard
- Lớp của tôi → /classes
- Bài tập → /assignments
- Bài nộp của tôi → /me/submissions
- Thông báo → /notifications

Critical rules:

- Do not show dead nav items.
- Do not show misleading nav items.
- Active state must be correct.
- /assignments must not activate /classes.
- Clicking “Bài tập” must open /assignments, not /classes.
- Detail links must use correct IDs.
- Student must not see Users.
- Student must not see admin actions.

==================================================
15. FRONTEND API CLIENT
==================================================

Create/clean:

frontend/src/lib/api.ts

Must include:

- Axios instance
- baseURL from env:
  VITE_API_BASE_URL or default http://localhost:8080/api/v1
- Authorization Bearer token interceptor
- 401 handling
- consistent error parsing
- ApiResponse<T> type
- PageResponse<T> type
- extractData(response)

API returns:

{ success, message, data }

Hooks should return data directly, not raw Axios response.

Create:

frontend/src/lib/query-keys.ts

Centralized query keys:

- auth.me
- users.list/detail
- classes.list/detail
- lessons.byClass/detail
- materials.byClass/detail
- assignments.list/byClass/detail
- submissions.byAssignment/me/detail
- grading.byClass
- notifications.list
- dashboard.teacher/admin/student
- activity.recent/byClass

==================================================
16. FEATURE API / HOOK REQUIREMENTS
==================================================

For every feature area, create:

- types.ts
- api.ts
- hooks.ts
- components/

Example:

features/classes/api.ts:

- getClasses()
- getClass(id)
- createClass(input)
- updateClass(id, input)
- deleteClass(id)
- addAdmin(classId, userId)
- removeAdmin(classId, adminId)
- addStudent(classId, userId)
- removeStudent(classId, studentId)
- updateStudentStatus(classId, studentId, status)

features/classes/hooks.ts:

- useClasses()
- useClass(id)
- useCreateClass()
- useUpdateClass()
- useDeleteClass()
- useAddClassAdmin()
- useAddClassStudent()
- useUpdateClassStudentStatus()

Do this for:

- auth
- users
- classes
- lessons
- materials
- assignments
- submissions
- grading
- notifications
- files
- dashboard
- activity

Use TanStack Query for:

- all GETs
- mutation invalidation
- loading/error states
- optimistic updates only if safe

==================================================
17. FORM REQUIREMENTS
==================================================

Create real forms for:

Auth:

- Login
- Change password

Users:

- Create user
- Edit user
- Change status
- Delete user confirm

Classes:

- Create class
- Edit class
- Assign admin
- Add student
- Update student membership status
- Delete class confirm

Lessons:

- Create lesson
- Edit lesson
- Delete lesson confirm

Materials:

- Create material
- Edit material
- Toggle visibility
- Upload file
- Delete material confirm

Assignments:

- Create assignment
- Edit assignment
- Publish
- Close
- Copy
- Delete

Submissions:

- Submit assignment
- Edit submission if allowed
- Delete submission if allowed

Grading:

- Grade submission
- Update grade
- Request resubmit

Notifications:

- Create notification
- Delete notification
- Send reminder if implemented

Every form must:

- use React Hook Form
- use Zod
- show field errors
- disable submit while submitting
- show success/error messages
- invalidate TanStack Query after mutation
- close dialog on success
- never silently fail

Destructive actions:

- Must use confirm dialog
- No instant delete without confirmation

==================================================
18. UI COMPONENT REQUIREMENTS
==================================================

Dashboard components:

- MetricCard
- TrendCard
- ChartCard
- TaskListCard
- ClassHealthCard
- RiskStudentCard
- DeadlineList
- RecentActivityTimeline
- QuickActionGrid
- ProgressRing
- SubmissionRateBar

Data components:

- DataTable
- DataToolbar
- SearchInput
- FilterSelect
- StatusBadge
- RoleBadge
- DeadlinePill
- ScoreBadge
- RiskBadge
- EmptyState
- LoadingState
- ErrorState

Form components:

- FormSection
- FormField
- FormActions
- ConfirmDialog
- CreateUserDialog
- CreateClassDialog
- AssignmentFormDialog
- GradeSubmissionDialog
- RequestResubmitDialog
- UploadFileDialog
- NotificationDialog

Chart components:

Use Recharts or equivalent.

Create:

- LineChartCard if needed
- BarChartCard
- DonutChartCard
- StackedBarChartCard
- MiniTrendChart
- ClassPerformanceChart
- SubmissionRateChart
- GradeDistributionChart
- AssignmentWorkflowChart

==================================================
19. DESIGN DIRECTION
==================================================

Implement a much better UI.

Design direction:

“Korean Clean Blue Learning System”

Target feeling:

- Korean-inspired
- Clean
- Calm
- Light blue
- Airy
- Focused
- Trustworthy
- Student-friendly
- Modern edtech
- Professional enough for real class management

Palette:

- Background: #F5FAFF or #F7FBFF
- Surface: #FFFFFF
- Primary Blue: #3B82F6
- Soft Primary: #DBEAFE
- Deep Blue: #1E3A8A
- Sky: #7DD3FC
- Muted Blue Gray: #64748B
- Text: #0F172A
- Muted Text: #64748B
- Border: #D8E7F7 or #E2E8F0
- Success: #16A34A
- Warning: #F59E0B
- Danger: #EF4444

Rules:

- Mostly white/blue
- No rainbow cards
- No chaotic mascot UI
- No boring gray enterprise dashboard
- No fake decoration
- Enough whitespace
- Concise copy
- Clear hierarchy
- Clean rounded cards
- Obvious actions
- Polished tables/forms
- Good empty states
- Loading skeletons
- Responsive if feasible

==================================================
20. I18N AND TYPOGRAPHY
==================================================

Default UI language:

Vietnamese with accents.

Support Korean locale:

- VI / 한국어 toggle
- persist locale in localStorage
- set document.documentElement.lang

Font strategy:

:root {
  --font-vi: "Be Vietnam Pro", "Inter", system-ui, sans-serif;
  --font-ko: "Noto Sans KR", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --font-ui: "Be Vietnam Pro", "Inter", "Noto Sans KR", system-ui, sans-serif;
}

body {
  font-family: var(--font-ui);
}

:lang(ko),
.font-ko {
  font-family: var(--font-ko);
  word-break: keep-all;
}

:lang(vi),
.font-vi {
  font-family: var(--font-vi);
}

Vietnamese visible UI must have accents.

Do not use:

- Dang nhap
- Khong
- Chua
- Lop hoc
- Hoc vien
- Bai tap
- Tai lieu
- Thong bao
- Gui
- Tao
- Sua
- Xoa
- Cham bai
- Diem
- Nop bai
- Quyen
- Trang thai
- Han nop
- Giao vien
- Quan ly
- Tong quan

Use:

- Đăng nhập
- Không
- Chưa
- Lớp học
- Học viên
- Bài tập
- Tài liệu
- Thông báo
- Gửi
- Tạo
- Sửa
- Xóa
- Chấm bài
- Điểm
- Nộp bài
- Quyền
- Trạng thái
- Hạn nộp
- Giáo viên
- Quản lý
- Tổng quan

==================================================
21. DEMO DATA REQUIREMENTS
==================================================

Create/update:

scripts/seed-demo-data.sh

Requirements:

- bash
- curl
- jq
- login teacher/admin/students
- create data through real APIs
- do not hardcode runtime IDs
- parse IDs from responses
- idempotent if possible or use unique suffix
- log clearly
- safe to run after backend is up

Seed accounts:

Teacher:
- teacher@hoanobita.com / Password123!

Admin:
- admin@hoanobita.com / Password123!

Student 1:
- student1@hoanobita.com / Password123!

Student 2:
- student2@hoanobita.com / Password123!

Demo data:

At least 4 classes:

1. TOPIK 2-3 Foundation
2. TOPIK 3-4 Intensive
3. TOPIK 5-6 Writing Clinic
4. Giao tiếp tiếng Hàn A1

At least:

- 12 students
- assigned admins
- assigned students
- 2–4 lessons per class
- 3–5 materials per class
- 3–5 assignments per class
- assignment statuses:
  - DRAFT
  - PUBLISHED
  - CLOSED
- submissions:
  - SUBMITTED
  - LATE
  - GRADED
  - RESUBMIT_REQUESTED if supported
- grades with realistic feedback
- notifications

Demo content must be realistic and Vietnamese with accents.

Examples:

Materials:

- Từ vựng chủ đề trường học
- Mẫu câu viết TOPIK câu 53
- Checklist làm bài nghe
- Ngữ pháp trọng tâm tuần 2

Assignments:

- Viết đoạn văn giới thiệu bản thân
- Luyện nghe TOPIK II - Buổi 03
- Bài đọc hiểu chủ đề du học
- Viết biểu đồ TOPIK câu 53
- Ôn ngữ pháp -(으)ㄴ/는 편이다

Feedback:

- Bài viết có bố cục rõ. Cần chú ý chia thì và liên kết câu.
- Từ vựng phù hợp chủ đề, nhưng cần giảm lặp từ.
- Phần mở bài tốt. Hãy bổ sung ví dụ cụ thể hơn.

==================================================
22. API TEST SCRIPT REQUIREMENTS
==================================================

Create/update:

scripts/test-api.sh

Requirements:

- bash
- curl
- jq
- color output
- functions:
  - log_info
  - log_success
  - log_error
  - assert_status
  - login
  - api_get
  - api_post
  - api_patch
  - api_delete
  - extract_body
  - extract_status
- Store tokens for teacher/admin/student1/student2
- Parse IDs from responses
- Do not hardcode runtime IDs except seed credentials
- Test happy path, unauthorized, forbidden, validation, business rules
- Print summary:
  - total tests
  - passed
  - failed
- exit 1 if any fail
- exit 0 if all pass

Must cover at least:

- Auth
- Users
- Classes
- Lessons
- Materials
- Assignments
- Submissions
- Grading
- Notifications
- Dashboard APIs
- Permissions
- Soft delete
- Validation

Minimum expected tests:

- 65+ tests
- Prefer 80+ if dashboard APIs are added

Must test:

- Teacher dashboard 200
- Admin dashboard 200 and scoped
- Student dashboard 200
- Student cannot access teacher dashboard
- Admin cannot access teacher dashboard
- Teacher can access global data
- Admin cannot access unassigned class data
- Student cannot access admin pages/API
- Dashboard numbers are present and non-null
- API response format is consistent

==================================================
23. BACKEND TESTS
==================================================

Create/update tests:

- AuthServiceTest
- ClassPermissionServiceTest
- AssignmentServiceTest
- SubmissionServiceTest
- GradingServiceTest
- DashboardServiceTest
- NotificationServiceTest if feasible
- ActivityServiceTest if implemented

Integration tests if feasible:

- AuthControllerIT
- ClassroomControllerIT
- AssignmentSubmissionFlowIT
- DashboardControllerIT

Test:

- login success/failure
- suspended user cannot login
- role permission
- class membership permission
- assignment visibility
- submit assignment
- closed assignment cannot submit
- grade max score validation
- submission status becomes GRADED
- student cannot see other student submission
- admin cannot access unassigned class
- teacher dashboard has global metrics
- admin dashboard is scoped
- student dashboard is scoped
- today tasks are generated
- risk students are calculated
- class health is calculated

==================================================
24. FRONTEND QA DOCUMENTATION
==================================================

Update/create:

frontend-audit.md

Must include:

1. Navigation bugs found
2. Route mapping table
3. Pages with Vietnamese text issues
4. Pages with clutter/excessive copy
5. Pages missing loading/empty/error states
6. API integration issues
7. Role-based UX issues
8. Design system issues
9. Demo data gaps
10. Dashboard analytics issues
11. Fixes performed

Update/create:

frontend-qa-checklist.md

Table columns:

- Role
- Route
- Expected page
- API used
- Verification result
- Notes

Include rows for:

- TEACHER_OWNER
- CLASS_ADMIN
- STUDENT

Verify:

Teacher:

- login
- dashboard
- users
- create user
- classes
- class detail tabs
- lessons
- materials
- assignments
- submissions
- grading
- notifications

Admin:

- login
- dashboard scoped
- assigned classes only
- class detail
- lessons/materials/assignments in assigned class
- grading assigned classes
- cannot access unassigned/global pages

Student:

- login
- dashboard
- joined classes only
- assignments
- submit assignment
- my submissions
- grade feedback
- cannot access users/grading/admin pages

==================================================
25. DEVOPS / DOCS
==================================================

Create/update:

- docker-compose.yml
- backend/Dockerfile
- frontend/Dockerfile
- .github/workflows/ci.yml
- README.md
- frontend/README.md if useful

README must include:

- Requirements
- How to run PostgreSQL
- How to run backend
- How to run frontend
- Seed accounts
- How to run API tests
- How to seed demo data
- How to run backend tests
- How to run frontend typecheck/lint/build
- Swagger URL
- Dashboard API docs
- Common troubleshooting
- Known limitations

CI should run:

- backend compile
- backend tests
- frontend typecheck
- frontend lint
- frontend build

API tests in CI are optional if database/backend orchestration is too heavy, but document local API test requirement.

==================================================
26. REQUIRED COMMANDS TO RUN
==================================================

You must run and fix until pass.

From project root:

1. Start database:

docker compose up -d postgres

2. Backend compile:

cd backend && ./mvnw -q compile

3. Backend tests:

cd backend && ./mvnw -q test

4. Backend package:

cd backend && ./mvnw -q package -DskipTests

5. Frontend typecheck:

cd frontend && npm run typecheck

If no typecheck script exists, add:

"typescript": not needed
"typecheck": "tsc --noEmit"

or appropriate command for current Vite TS setup.

6. Frontend lint:

cd frontend && npm run lint

If no lint script exists, add and configure it reasonably.

7. Frontend build:

cd frontend && npm run build

8. Start backend:

cd backend && ./mvnw spring-boot:run

Run it in a way that lets API scripts execute while server is up.

9. API tests:

bash scripts/test-api.sh

10. Demo data:

bash scripts/seed-demo-data.sh

11. API tests again after demo:

bash scripts/test-api.sh

12. Vietnamese no-accent grep:

grep -RInE "Dang|Khong|Chua|Lop|Hoc|Bai|Tai|Thong|Gui|Tao|Sua|Xoa|Cham|Diem|Nop|Quyen|Trang thai|Han nop|Giao vien|Quan ly|Tong quan" frontend/src || true

If grep finds visible UI strings without accents, fix them.
Be careful not to rename code identifiers unnecessarily.

13. Diagnostics:

Check frontend/src diagnostics.
There must be no unresolved TypeScript/lint/editor diagnostics.

14. Optional browser smoke if browser tool is available:

- Login teacher
- Login admin
- Login student
- Open dashboard/classes/assignments/submissions/notifications
- Check route guards
- Check no dead buttons
- Check forms submit to real API

==================================================
27. ACCEPTANCE CRITERIA
==================================================

Backend complete only when:

1. Backend compiles.
2. Backend tests pass.
3. Backend package builds.
4. Flyway migrations run.
5. PostgreSQL works.
6. Swagger UI opens.
7. API response format is consistent.
8. Permission checks work.
9. Soft delete works.
10. Validation errors are clear.
11. Dashboard APIs exist and are scoped.
12. Teacher dashboard returns global metrics.
13. Admin dashboard returns assigned-class metrics only.
14. Student dashboard returns own metrics only.
15. Activity/recent activity is implemented or derived.
16. Dashboard metrics are not fake.

API complete only when:

17. scripts/test-api.sh exists.
18. scripts/test-api.sh passes.
19. At least 65+ API tests exist.
20. Dashboard API tests exist.
21. Unauthorized/forbidden/validation/business cases are tested.
22. API tests pass before and after demo seed.

Frontend complete only when:

23. Frontend typecheck passes.
24. Frontend lint passes.
25. Frontend build passes.
26. Routes work.
27. Sidebar navigation is correct.
28. “Bài tập” opens assignments, not classes.
29. /assignments does not activate /classes.
30. Active nav state is correct.
31. Role-based nav is correct.
32. Teacher/Admin/Student dashboards differ logically.
33. Teacher dashboard is strong and data-rich.
34. Admin dashboard is scoped and data-rich.
35. Student dashboard is clean and focused.
36. No student sees admin pages.
37. No obvious dead buttons.
38. Frontend uses real backend APIs.
39. Loading states exist.
40. Empty states exist.
41. Error states exist.
42. Forms use React Hook Form + Zod.
43. Mutations invalidate queries.
44. Dashboard charts use real/derived backend data.
45. No fake static stats.
46. UI follows Korean Clean Blue Learning System.
47. UI is not boring gray dashboard.
48. UI is not rainbow/noisy.
49. Vietnamese UI text has accents.
50. Korean locale exists.
51. Font supports Vietnamese/Korean.

Demo complete only when:

52. scripts/seed-demo-data.sh exists.
53. Demo script creates rich demo data.
54. Demo data is realistic and Vietnamese with accents.
55. Frontend is easy to evaluate with demo data.

Docs/QA complete only when:

56. README is complete.
57. frontend-audit.md exists and is updated.
58. frontend-qa-checklist.md exists and is updated.
59. CI workflow exists.
60. Dockerfiles exist.

Final complete only when:

61. No backend/API contract is broken.
62. No failing builds.
63. No failing tests.
64. No unresolved frontend diagnostics.
65. Known limitations are documented.
66. Full verification commands were actually run and passed.

==================================================
28. IMPORTANT IMPLEMENTATION RULES
==================================================

Do NOT:

- Fake dashboard numbers
- Hardcode runtime IDs
- Hardcode demo-only UI values
- Expose password hash
- Use ts-nocheck to hide errors
- Leave placeholder pages
- Leave dead buttons
- Put everything in App.tsx
- Put everything in one giant page file
- Break existing API tests
- Claim success without running commands
- Let admin see unassigned data
- Let student see admin data
- Let frontend-only checks replace backend permission checks

Do:

- Inspect existing backend before changing
- Respect existing API contract unless improving deliberately
- Add migrations for DB changes
- Add tests for new backend logic
- Add API script coverage for dashboard
- Add feature-based frontend hooks
- Add loading/empty/error states
- Add confirm dialogs for destructive actions
- Add clear Vietnamese messages
- Use real API responses
- Document limitations honestly

==================================================
29. PRIORITY PLAN
==================================================

If time is limited, implement in this priority:

Phase A — Backend dashboard analytics

1. Teacher dashboard API
2. Admin dashboard API
3. Student dashboard API
4. Dashboard tests
5. API script tests

Phase B — Frontend dashboard upgrade

1. Teacher dashboard:
   - KPI
   - charts
   - today tasks
   - class health
   - due soon
   - risk students
   - recent activity

2. Admin dashboard:
   - scoped KPI
   - charts
   - scoped tasks
   - assigned class health

3. Student dashboard:
   - own classes
   - upcoming assignments
   - submissions
   - feedback

Phase C — Class operation center

1. Classes list
2. Class detail
3. Students tab
4. Lessons tab
5. Materials tab
6. Assignments tab
7. Submissions tab
8. Grading tab
9. Notification tab

Phase D — Assignment/submission/grading workflow

1. Assignment list/detail
2. Submission progress
3. Assignment submissions
4. Submission detail
5. Grading center split view
6. Grade/update grade/request resubmit

Phase E — Materials/files/notifications polish

1. Upload file UI
2. Material library
3. Visibility toggle
4. Download
5. Notification targeting/reminders

Phase F — Docs and verification

1. QA docs
2. README
3. Full test commands
4. Fix loop

==================================================
30. FINAL RESPONSE FORMAT
==================================================

At the end, report:

1. Current completion status:
   - Complete
   - Partially complete
   - Not complete

2. What was built

3. Backend modules completed

4. New backend APIs added

5. Dashboard APIs added

6. Permission model completed

7. Frontend pages completed

8. Forms completed

9. Dashboard UX completed

10. Charts completed

11. Role-based UX completed

12. Navigation fixes

13. UI/UX improvements

14. i18n/font strategy implemented

15. Demo data added

16. Scripts created/updated

17. QA docs updated

18. Commands actually run

19. Test results:
    - docker compose up -d postgres
    - backend compile
    - backend tests
    - backend package
    - frontend typecheck
    - frontend lint
    - frontend build
    - backend startup
    - API tests
    - demo seed
    - API tests after demo
    - Vietnamese grep
    - frontend diagnostics

20. Seed accounts

21. Swagger URL

22. How to run locally

23. Known limitations

24. Confirmation that acceptance criteria passed or explanation of what remains

Do not claim complete unless every command actually passed.
If anything fails, fix it and rerun.