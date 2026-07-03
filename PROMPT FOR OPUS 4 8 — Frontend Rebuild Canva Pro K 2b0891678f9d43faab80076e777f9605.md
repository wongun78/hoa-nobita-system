# PROMPT FOR OPUS 4.8 — Frontend Rebuild Canva Pro Korean LMS

# PROMPT FOR OPUS 4.8 — Frontend Rebuild “Canva Pro Korean LMS”

> Copy toàn bộ prompt này vào Claude Opus 4.8 / Claude Code / Cursor. Mục tiêu: rebuild frontend thật đẹp, hiện đại, tối ưu, nghệ thuật hóa theo tinh thần Hàn Quốc, và vận dụng toàn bộ backend API hiện có của HOA NOBITA Korean Platform.
> 

---

## 0. ROLE CỦA BẠN

You are a **senior product engineer + staff frontend architect + elite UI/UX designer**.

You are rebuilding the frontend for **HOA NOBITA Korean Platform**, an internal LMS for Korean language classes, TOPIK learning, homework, submissions, grading, attendance, calendar, reports, and notifications.

Your output must be **production-quality**, not demo code.

Think like:

- **Canva Pro** for polish, spacing, delightful UI, smooth visuals.
- **Linear / Notion / Raycast** for speed, structure, keyboard-friendly flows.
- **Toss / Kakao / Korean education apps** for soft Korean-inspired visual language.
- **A real LMS operations dashboard** for teacher/admin productivity.

The frontend must feel:

- premium,
- calm,
- organized,
- fast,
- beautiful,
- Korea-themed but not childish,
- suitable for serious TOPIK learning.

---

## 1. PROJECT CONTEXT

Project name: **HOA NOBITA Korean Platform**

Domain: LMS for Korean classes:

- TOPIK I
- TOPIK II
- Korean communication classes
- Teacher/admin managed classes
- Student assignment/submission/grading workflow

The backend API is already implemented and compile/test clean.

Base API:

```
/api/v1
```

Authentication:

```
Authorization: Bearer <accessToken>
```

Public endpoint:

```
POST /api/v1/auth/login
```

All other endpoints require authentication.

Important auth decision:

- Login only.
- No register.
- No forgot password.
- No refresh token.
- Access token is long-lived.
- Users are created by `TEACHER_OWNER`.
- If user forgets password, admin resets/handles operationally.

---

## 2. FRONTEND TECH STACK

Use this stack unless the existing project already has a compatible equivalent:

```
React 18
Vite
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Lucide React
TanStack Query
TanStack Table
React Hook Form
Zod
Recharts
Framer Motion
date-fns
clsx / class-variance-authority
```

Optional but nice:

```
sonner for toast
cmdk for command palette
react-dropzone for file upload
```

Do NOT add heavy unnecessary UI libraries if shadcn/ui can handle it.

---

## 3. CORE ENGINEERING REQUIREMENTS

### 3.1. Code Quality

Implement clean frontend architecture:

```
src/
  app/
    router.tsx
    providers.tsx
  api/
    client.ts
    endpoints/
      auth.api.ts
      users.api.ts
      classes.api.ts
      lessons.api.ts
      materials.api.ts
      assignments.api.ts
      submissions.api.ts
      grading.api.ts
      notifications.api.ts
      dashboard.api.ts
      activity.api.ts
      reports.api.ts
      files.api.ts
      attendance.api.ts
      calendar.api.ts
    types/
      common.types.ts
      auth.types.ts
      user.types.ts
      class.types.ts
      lesson.types.ts
      material.types.ts
      assignment.types.ts
      submission.types.ts
      grading.types.ts
      notification.types.ts
      dashboard.types.ts
      activity.types.ts
      report.types.ts
      file.types.ts
      attendance.types.ts
      calendar.types.ts
  components/
    layout/
    ui/
    data/
    dashboard/
    forms/
    charts/
    feedback/
  features/
    auth/
    teacher/
    admin/
    student/
    classes/
    users/
    assignments/
    submissions/
    grading/
    notifications/
    attendance/
    calendar/
    reports/
    materials/
  hooks/
  lib/
  pages/
```

If the existing project structure differs, adapt without breaking existing conventions.

### 3.2. API Client Rules

Backend response envelope:

```tsx
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  errors: ApiError[] | null
}

type ApiError = {
  field?: string
  message: string
}
```

Paginated response:

```tsx
type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}
```

Implement a global API client that:

- Reads token from auth storage.
- Sends `Authorization: Bearer <accessToken>`.
- Unwraps `response.data.data`.
- Handles binary downloads separately.
- Maps validation errors to forms.
- Redirects to login on `401`.
- Shows permission UI on `403`.
- Shows polished toast on unexpected errors.
- Never crashes the app because one query failed.

### 3.3. Query Strategy

Use TanStack Query:

- All list endpoints use query keys with pagination/filter/search params.
- Mutations invalidate affected queries.
- Use optimistic update where safe:
    - notification read,
    - read all,
    - visibility toggle,
    - profile update,
    - student code update.
- Keep stale time reasonable:
    - dashboard: 30s–60s,
    - static lists: 1–5 min,
    - notifications: 15s–30s.

---

## 4. STRICT TYPES / ENUMS

Create strict TypeScript unions:

```tsx
type RoleName = 'TEACHER_OWNER' | 'CLASS_ADMIN' | 'STUDENT'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type ClassStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
type LessonStatus = 'DRAFT' | 'PUBLISHED'
type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED' | 'RESUBMIT_REQUESTED'
type TargetType = 'CLASS' | 'USER' | 'ALL'
type MemberStatus = 'ACTIVE' | 'PAUSED' | 'REMOVED'
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
```

Never use arbitrary strings for status/role values.

---

## 5. VISUAL DESIGN DIRECTION — “CANVA PRO × KOREAN LMS”

### 5.1. Design Keywords

The app should feel like:

```
premium Korean education dashboard
soft but professional
minimal but warm
data-rich but not intimidating
Canva-level polish
Notion-level clarity
Toss-level friendliness
```

### 5.2. Korean-Inspired Art Direction

Use Korean inspiration subtly:

- Soft hanbok-inspired gradients.
- Seoul spring palette.
- Paper-like cards inspired by hanji texture.
- Gentle rounded corners.
- Light cherry blossom / sky / cream accents.
- Occasional Hangul decorative microcopy or icons, but keep the main product Vietnamese/English as required.
- Avoid cliché overload: no excessive flags, no cartoonish K-pop theme, no clutter.

Palette proposal:

```
Primary Indigo: #4F46E5
Korean Sky Blue: #BAE6FD
Blossom Pink: #FBCFE8
Hanji Cream: #FFF7ED
Soft Mint: #BBF7D0
Ink Navy: #0F172A
Muted Slate: #64748B
Danger Coral: #FB7185
Warning Amber: #F59E0B
Success Emerald: #10B981
```

Background:

```
Light mode:
- base: #F8FAFC
- decorative gradients: soft radial pink/blue/cream
- cards: white / translucent white

Dark mode:
- base: #020617
- cards: #0F172A
- border: #1E293B
- accents: indigo / sky / pink but muted
```

### 5.3. UI Style

Use:

- rounded-2xl / rounded-3xl cards,
- subtle glassmorphism only in hero/dashboard cards,
- soft shadows,
- fine borders,
- gradient icons,
- high-quality empty states,
- tasteful motion,
- beautiful data visualizations.

Do NOT:

- make everything neon,
- use too many gradients at once,
- make dashboards look like crypto dashboards,
- sacrifice readability for decoration.

### 5.4. Typography

Use a modern font stack. If possible:

```css
font-family: Inter, "Noto Sans", "Noto Sans KR", system-ui, sans-serif;
```

Headings:

- bold,
- tight tracking,
- clean hierarchy.

Body:

- readable,
- enough line-height,
- no tiny gray text for important info.

### 5.5. Motion

Use Framer Motion for:

- page transitions,
- card entrance,
- chart reveal,
- modal entrance,
- hover lift,
- toast polish.

Motion rules:

- subtle,
- fast,
- no distracting bounce,
- respect reduced motion.

---

## 6. APP SHELL / LAYOUT

Implement a role-aware app shell.

### 6.1. Desktop Layout

```
Sidebar left
Topbar
Main content
Optional right insight panel on dashboards
```

Sidebar:

- Logo: HOA NOBITA
- Korean-inspired small mark, e.g. “한”
- Role badge
- Navigation grouped by role
- Active route indicator
- Collapsible

Topbar:

- Global search / command palette
- Notification bell with unread count
- Calendar shortcut
- User avatar dropdown
- Theme toggle

### 6.2. Mobile Layout

Especially important for students.

Mobile:

- Bottom navigation for student:
    - Home
    - Classes
    - Assignments
    - Calendar
    - Notifications
- Teacher/admin mobile can use drawer sidebar.
- Touch target minimum 44px.
- Tables collapse into cards.

---

## 7. ROLE-BASED NAVIGATION

### 7.1. TEACHER_OWNER Navigation

```
Dashboard
Users
Classes
Assignments
Grading Center
Materials
Notifications
Attendance
Calendar
Reports
Settings/Profile
```

### 7.2. CLASS_ADMIN Navigation

```
Dashboard
My Classes
Assignments
Grading
Materials
Notifications
Attendance
Calendar
Reports (class scoped)
Profile
```

### 7.3. STUDENT Navigation

```
Home
My Classes
Assignments
My Submissions
My Grades
Materials
Attendance
Calendar
Notifications
Profile
```

Enforce route guards:

- Teacher-only pages cannot be opened by admin/student.
- Admin only sees assigned classes.
- Student only sees own data.

---

## 8. FRONTEND API COVERAGE REQUIREMENT

You must create typed API functions/hooks for **all backend groups**:

```
Auth
Users/Profile
Classes
Lessons
Materials
Assignments
Submissions
Grading
Notifications
Dashboard
Activity
Reports
Files
Attendance
Calendar
```

Do not ignore “small” endpoints. Every endpoint should have either:

- an API function,
- a React Query hook,
- or both if used directly by UI.

---

## 9. BACKEND API SUMMARY TO IMPLEMENT AGAINST

### 9.1. Auth

```
POST /auth/login
GET /auth/me
POST /auth/change-password
POST /auth/logout
```

### 9.2. Users/Profile

```
PATCH /me
GET /users
POST /users
GET /users/{id}
GET /users/{id}/activity-logs
GET /users/{id}/progress
PATCH /users/{id}
PATCH /users/{id}/status
DELETE /users/{id}
```

### 9.3. Classes

```
GET /classes
POST /classes
GET /classes/{classId}
PATCH /classes/{classId}
DELETE /classes/{classId}
POST /classes/{classId}/admins
DELETE /classes/{classId}/admins/{adminId}
GET /classes/{classId}/students
PATCH /classes/{classId}/students/{studentId}/code
POST /classes/{classId}/students
POST /classes/{classId}/students/bulk
DELETE /classes/{classId}/students/{studentId}
PATCH /classes/{classId}/students/{studentId}/status
GET /classes/{classId}/students/export?format=csv
GET /classes/{classId}/stats
```

### 9.4. Lessons

```
GET /classes/{classId}/lessons
POST /classes/{classId}/lessons
GET /lessons/{lessonId}
PATCH /lessons/{lessonId}
DELETE /lessons/{lessonId}
```

### 9.5. Materials

```
GET /classes/{classId}/materials
POST /classes/{classId}/materials
GET /materials/{materialId}
PATCH /materials/{materialId}
DELETE /materials/{materialId}
PATCH /materials/{materialId}/visibility
```

### 9.6. Assignments

```
GET /classes/{classId}/assignments
GET /assignments
POST /classes/{classId}/assignments
GET /assignments/{assignmentId}
GET /assignments/{assignmentId}/progress
PATCH /assignments/{assignmentId}
PATCH /assignments/{assignmentId}/publish
PATCH /assignments/{assignmentId}/close
POST /assignments/{assignmentId}/copy
DELETE /assignments/{assignmentId}
GET /assignments/{assignmentId}/missing-students
POST /assignments/{assignmentId}/send-reminder
POST /classes/{classId}/assignments/send-reminders
```

### 9.7. Submissions

```
GET /assignments/{assignmentId}/submissions
POST /assignments/{assignmentId}/submissions
GET /submissions/{submissionId}
PATCH /submissions/{submissionId}
DELETE /submissions/{submissionId}
GET /me/submissions
```

### 9.8. Grading

```
GET /classes/{classId}/grading/submissions
POST /assignments/{assignmentId}/submissions/bulk-grade
POST /submissions/{submissionId}/grade
PATCH /grades/{gradeId}
POST /submissions/{submissionId}/request-resubmit
```

### 9.9. Notifications

```
GET /notifications
GET /notifications/unread-count
POST /notifications/read-all
POST /notifications
DELETE /notifications/{id}
POST /notifications/{id}/read
```

### 9.10. Dashboard

```
GET /dashboard/teacher
GET /dashboard/admin
GET /dashboard/student
```

### 9.11. Activity

```
GET /activity/recent
GET /classes/{classId}/activity
```

### 9.12. Reports

```
GET /reports/system
GET /reports/system/export?format=csv
GET /reports/classes/{classId}
GET /reports/classes/{classId}/export?format=csv
```

### 9.13. Files

```
POST /files/upload
GET /files/{fileId}
GET /files/{fileId}/download
```

### 9.14. Attendance

```
GET /classes/{classId}/attendance/summary
POST /lessons/{lessonId}/attendance
GET /lessons/{lessonId}/attendance
GET /students/{studentId}/attendance
PATCH /attendance/{attendanceId}
```

### 9.15. Calendar

```
GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&classId=uuid
```

---

## 10. MUST-BUILD SCREENS

Build the app screen-by-screen. Each screen must be visually polished, responsive, and wired to real APIs.

---

# PART A — AUTH & GLOBAL FOUNDATION

## 10.1. Login Page

Route:

```
/login
```

Design:

- Full-screen Korean-inspired gradient background.
- Floating glass login card.
- Subtle Hangul pattern in background.
- App logo “HOA NOBITA Korean Platform”.
- Illustration area: Seoul skyline / study desk / Korean classroom-inspired abstract illustration using CSS gradients, not external copyrighted images.
- Form: identifier + password.
- “Login only” system. No register link. No forgot password link.
- Error states clear and elegant.
- On success:
    - Save token.
    - Save current user.
    - Redirect by role:
        - TEACHER_OWNER → `/teacher/dashboard`
        - CLASS_ADMIN → `/admin/dashboard`
        - STUDENT → `/student/home`

First login:

- If `firstLogin === true`, show a polite modal suggesting change password, but do not block unless product already requires it.

---

## 10.2. App Shell

Implement:

- Role-based sidebar.
- Topbar with notifications.
- User dropdown.
- Theme toggle.
- Command palette.
- Responsive behavior.

Notification bell:

- Call `GET /notifications/unread-count`.
- Dropdown shows latest notifications from `GET /notifications`.
- Mark one as read via `POST /notifications/{id}/read`.
- Mark all via `POST /notifications/read-all`.

---

# PART B — TEACHER_OWNER EXPERIENCE

## 10.3. Teacher Dashboard

Route:

```
/teacher/dashboard
```

API:

```
GET /dashboard/teacher
GET /activity/recent
GET /notifications/unread-count
```

This is the flagship screen. Make it beautiful like a Canva Pro analytics homepage.

Sections:

### Hero

- Greeting: “Chào Anh Hoà, hôm nay lớp học đang vận hành thế nào?”
- Date in Vietnamese.
- Soft Korean gradient card.
- Quick actions:
    - Tạo lớp
    - Thêm học viên
    - Tạo bài tập
    - Gửi thông báo
    - Mở lịch học

### KPI Cards

Use animated metric cards:

- Total classes
- Active classes
- Total students
- Total assignments
- Need grading
- Submission rate
- Average score
- Unread notifications

Each card:

- icon,
- color accent,
- micro trend label,
- skeleton state,
- hover lift.

### Charts

Use Recharts:

- Class status chart
- Submission rate by class
- Need grading by class
- Average score by class
- Grade distribution
- Assignment workflow

Charts must have:

- custom tooltip,
- beautiful colors,
- empty state,
- responsive container.

### Today Tasks

From dashboard `todayTasks`.

Show priority list:

- need grading,
- due soon,
- missing submissions,
- resubmit requested.

Each task has CTA:

- “Chấm ngay”
- “Xem bài tập”
- “Gửi nhắc nhở”
- “Xem lớp”

### Class Health

Data from `classHealth`.

Show as beautiful table/cards:

- class name,
- student count,
- submission rate,
- avg score,
- need grading,
- risk students,
- health badge.

### Risk Students

Show top risk students:

- avatar initials,
- risk level,
- risk reasons,
- class,
- CTA to user progress.

### Upcoming Deadlines

Use `assignmentsDueSoon`.

Show timeline style.

### Recent Activity

Use `recentActivity`.

Show timeline with actor, action, target, time.

---

## 10.4. Users Management

Routes:

```
/teacher/users
/teacher/users/:id
```

APIs:

```
GET /users
POST /users
GET /users/{id}
GET /users/{id}/progress
GET /users/{id}/activity-logs
PATCH /users/{id}
PATCH /users/{id}/status
DELETE /users/{id}
```

Users List:

- Search.
- Role filter.
- Status filter.
- Pagination.
- Beautiful DataTable.
- Create user dialog.
- Temporary password display with copy button if returned.
- Role badges:
    - TEACHER_OWNER = purple
    - CLASS_ADMIN = blue
    - STUDENT = green
- Status badges.

User Detail:

- Profile hero.
- Role/status.
- Progress card if student.
- Activity timeline.
- Classes summary if data available.
- Actions:
    - edit profile,
    - change status,
    - delete user with confirm.

Student Progress:

- submission rate ring,
- average score,
- total/submitted/graded assignments,
- risk badge,
- risk reasons.

---

## 10.5. Classes Management

Routes:

```
/teacher/classes
/teacher/classes/:classId
```

APIs:

```
GET /classes
POST /classes
GET /classes/{classId}
PATCH /classes/{classId}
DELETE /classes/{classId}
GET /classes/{classId}/stats
POST /classes/{classId}/admins
DELETE /classes/{classId}/admins/{adminId}
GET /classes/{classId}/students
POST /classes/{classId}/students
POST /classes/{classId}/students/bulk
PATCH /classes/{classId}/students/{studentId}/code
PATCH /classes/{classId}/students/{studentId}/status
DELETE /classes/{classId}/students/{studentId}
GET /classes/{classId}/students/export?format=csv
```

Classes List:

- Card grid + table toggle.
- Search/filter by status.
- Class cards:
    - name,
    - code,
    - level range,
    - status,
    - student count,
    - admin chips,
    - progress ring,
    - Korean accent gradient top border.

Create/Edit Class Dialog:

- name,
- code,
- description,
- levelFrom/levelTo,
- start/end date,
- validation.

Class Detail:

Use tabbed layout with sticky header.

Header:

- Class name + code.
- Status badge.
- Level.
- Teacher.
- Admin chips.
- Student count.
- Action buttons:
    - edit class,
    - assign admin,
    - add students,
    - create lesson,
    - create assignment,
    - send notification,
    - export students.

Health Cards:

- total students,
- assignments,
- submissions,
- missing,
- late,
- graded,
- need grading,
- submission rate,
- average score.

Tabs:

1. Overview
2. Students
3. Lessons
4. Materials
5. Assignments
6. Submissions
7. Grading
8. Attendance
9. Activity
10. Notifications
11. Settings

### Students Tab

- Paginated students table.
- Search/status filter.
- Student code editable inline.
- Bulk add students.
- Remove student.
- Pause/reactivate student.
- Export CSV.
- Student progress quick drawer.

### Lessons Tab

- Timeline design.
- Lesson cards:
    - Buổi 01, Buổi 02...
    - title,
    - date,
    - status,
    - description,
    - actions.
- Create/edit/delete dialogs.

### Materials Tab

- Material library.
- Cards/table.
- Upload file via `/files/upload`.
- Create material from file or external URL.
- Toggle visibility.
- Preview metadata via `GET /files/{fileId}`.
- Download via `/files/{fileId}/download`.

### Assignments Tab

- Assignment cards/table.
- Status filter.
- Due date highlight.
- Progress mini bar using `GET /assignments/{id}/progress`.
- Actions:
    - view,
    - edit,
    - publish,
    - close,
    - copy,
    - delete,
    - send reminder,
    - preview missing students.

### Submissions Tab

- For selected assignment or all class.
- Data table with status, student, score, submittedAt.
- Quick grade action.
- View detail drawer.

### Grading Tab

- Embed split-view grading center scoped to class.

### Attendance Tab

- Attendance summary via `GET /classes/{id}/attendance/summary`.
- Lesson attendance selector.
- Bulk attendance UI:
    - mark all present,
    - mark individual absent/late,
    - notes.
- Beautiful attendance heatmap.

### Activity Tab

- `GET /classes/{id}/activity`.
- Timeline.

### Notifications Tab

- Create notification to this class.
- History list.

### Settings Tab

- Edit class.
- Admin assignment.
- Archive/delete danger zone.

---

## 10.6. Global Assignments

Routes:

```
/teacher/assignments
/teacher/assignments/:assignmentId
```

APIs:

```
GET /assignments
GET /assignments/{assignmentId}
GET /assignments/{assignmentId}/progress
PATCH /assignments/{assignmentId}
PATCH /assignments/{assignmentId}/publish
PATCH /assignments/{assignmentId}/close
POST /assignments/{assignmentId}/copy
DELETE /assignments/{assignmentId}
GET /assignments/{assignmentId}/missing-students
POST /assignments/{assignmentId}/send-reminder
GET /assignments/{assignmentId}/submissions
```

Assignments List:

- Search.
- Status filter.
- Class filter.
- Deadline filter.
- View modes:
    - table,
    - Kanban by status,
    - calendar-style due soon.

Assignment Detail:

- Hero card.
- Status + dueAt countdown.
- Max score.
- Instruction.
- Progress stats.
- Missing students preview.
- Send reminder dialog.
- Submissions table.
- Grading panel shortcut.

---

## 10.7. Grading Center

Routes:

```
/teacher/grading
/admin/grading
```

APIs:

```
GET /classes/{classId}/grading/submissions
POST /submissions/{submissionId}/grade
PATCH /grades/{gradeId}
POST /submissions/{submissionId}/request-resubmit
POST /assignments/{assignmentId}/submissions/bulk-grade
```

This must be extremely efficient.

Layout:

```
Left panel: filterable submission queue
Right panel: grading workspace
```

Left:

- class selector,
- assignment selector,
- status filter,
- search,
- paginated queue,
- late/need grading badges.

Right:

- student info,
- assignment info,
- submitted content,
- file preview/download,
- score input,
- feedback textarea,
- save grade,
- request resubmit,
- next submission.

UX:

- Ctrl/Cmd + Enter saves grade.
- Arrow up/down changes selected submission.
- Autosave feedback draft locally.
- Beautiful focus mode.
- Bulk grade modal.

---

## 10.8. Materials Library

Route:

```
/teacher/materials
/admin/materials
/student/materials
```

APIs:

```
GET /classes/{classId}/materials
POST /classes/{classId}/materials
GET /materials/{materialId}
PATCH /materials/{materialId}
DELETE /materials/{materialId}
PATCH /materials/{materialId}/visibility
POST /files/upload
GET /files/{fileId}
GET /files/{fileId}/download
```

UI:

- Material cards.
- File type icons.
- Search/class filter.
- Upload drag & drop.
- File validation.
- Visibility toggle for teacher/admin.
- Student sees only visible materials.

---

## 10.9. Notifications

Route:

```
/teacher/notifications
/admin/notifications
/student/notifications
```

APIs:

```
GET /notifications
GET /notifications/unread-count
POST /notifications/read-all
POST /notifications
DELETE /notifications/{id}
POST /notifications/{id}/read
```

UI:

- Notification inbox.
- Unread/read tabs.
- Create notification form for teacher/admin.
- Target:
    - ALL,
    - CLASS,
    - USER.
- Beautiful message preview.
- Read all.
- Delete.
- Deep link if target info is inferable.

---

## 10.10. Attendance

Routes:

```
/teacher/attendance
/admin/attendance
/student/attendance
```

APIs:

```
GET /classes/{classId}/attendance/summary
POST /lessons/{lessonId}/attendance
GET /lessons/{lessonId}/attendance
GET /students/{studentId}/attendance
PATCH /attendance/{attendanceId}
```

Teacher/Admin:

- Class selector.
- Summary cards:
    - attendance rate,
    - total lessons,
    - present,
    - absent,
    - late.
- Student attendance table.
- Heatmap.
- Mark attendance by lesson.

Student:

- Attendance history.
- Personal attendance rate.
- Status timeline.

---

## 10.11. Calendar

Route:

```
/calendar
```

API:

```
GET /calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&classId=uuid
```

Build:

- Month view.
- Week view.
- Agenda view.
- Event colors:
    - LESSON = blue/indigo,
    - ASSIGNMENT_DEADLINE = rose/amber.
- Filters by class.
- Event detail popover.
- Today panel.

---

## 10.12. Reports

Routes:

```
/teacher/reports
/admin/reports
```

APIs:

```
GET /reports/system
GET /reports/system/export?format=csv
GET /reports/classes/{classId}
GET /reports/classes/{classId}/export?format=csv
```

Teacher:

- System report.
- Class performances.
- Top students.
- Export CSV.

Admin:

- Class-scoped reports only.
- Export assigned class reports.

UI:

- Executive dashboard style.
- Charts.
- Tables.
- CSV download buttons.
- Empty states.

---

# PART C — CLASS_ADMIN EXPERIENCE

## 10.13. Admin Dashboard

Route:

```
/admin/dashboard
```

API:

```
GET /dashboard/admin
```

Same visual quality as teacher dashboard, but scoped to assigned classes.

Must include:

- assigned class count,
- student count,
- upcoming deadlines,
- need grading,
- submission rate,
- today tasks,
- recent activity,
- charts.

Admin must never see unassigned classes.

---

## 10.14. My Classes

Route:

```
/admin/classes
/admin/classes/:classId
```

Same class detail experience, but:

- no global user management,
- no delete class unless backend allows,
- no assign global admins unless permitted,
- all data scoped to assigned classes.

---

# PART D — STUDENT EXPERIENCE

## 10.15. Student Home

Route:

```
/student/home
```

API:

```
GET /dashboard/student
GET /notifications/unread-count
GET /calendar
```

Design:

- Mobile-first.
- Beautiful welcoming dashboard.
- Korean learning vibe.
- “Hôm nay bạn học gì?”
- Cards:
    - joined classes,
    - upcoming assignments,
    - overdue assignments,
    - recent grades,
    - notifications,
    - attendance summary if available.

---

## 10.16. Student Classes

Routes:

```
/student/classes
/student/classes/:classId
```

Student class detail tabs:

1. Overview
2. Lessons
3. Materials
4. Assignments
5. My Submissions
6. Attendance
7. Notifications

Student permissions:

- View joined classes only.
- View visible materials only.
- Submit assignments only if published/open.
- Edit submission only if backend allows.
- View own grade/feedback.

---

## 10.17. Student Assignments & Submission Flow

Routes:

```
/student/assignments
/student/assignments/:assignmentId
/student/submissions
/student/submissions/:submissionId
```

APIs:

```
GET /assignments
GET /assignments/{assignmentId}
POST /assignments/{assignmentId}/submissions
GET /me/submissions
GET /submissions/{submissionId}
PATCH /submissions/{submissionId}
DELETE /submissions/{submissionId}
POST /files/upload
GET /files/{fileId}
GET /files/{fileId}/download
```

Submission UX:

- Assignment detail.
- Deadline countdown.
- Rich textarea.
- External URL field.
- File upload.
- Submit button.
- Success animation.
- Late warning.
- Grade/feedback view.
- Resubmit requested state.

---

## 11. COMPONENT SYSTEM TO BUILD

Build reusable components:

### Layout

```
AppShell
Sidebar
Topbar
MobileBottomNav
CommandPalette
NotificationBell
UserMenu
Breadcrumbs
PageHeader
```

### Data

```
DataTable
PaginationControls
SearchInput
FilterBar
StatusBadge
RoleBadge
RiskBadge
DeadlinePill
ScoreBadge
MetricCard
```

### Dashboard

```
KpiGrid
ChartCard
TaskListCard
ClassHealthCard
RiskStudentCard
UpcomingDeadlineList
RecentActivityTimeline
QuickActionGrid
```

### Forms

```
CreateUserDialog
CreateClassDialog
LessonDialog
MaterialDialog
AssignmentDialog
GradeSubmissionPanel
BulkGradeDialog
NotificationDialog
AttendanceMarker
UploadFileDialog
ProfileDialog
ChangePasswordDialog
```

### Feedback

```
EmptyState
SkeletonCard
PageLoader
ErrorState
ForbiddenState
NotFoundState
ConfirmDialog
SuccessAnimation
```

### Charts

```
SubmissionRateChart
NeedGradingChart
AverageScoreChart
GradeDistributionChart
AssignmentWorkflowChart
ClassStatusChart
AttendanceHeatmap
```

Every component should:

- be typed,
- be reusable,
- support loading/empty/error states,
- look polished.

---

## 12. DATA TABLE STANDARD

Every table should support:

- server-side pagination,
- search,
- filter,
- sort if API supports,
- row actions,
- skeleton loading,
- empty state,
- mobile card fallback.

Use TanStack Table where useful.

Table style:

- soft borders,
- sticky header,
- subtle hover,
- status badges,
- action dropdown.

---

## 13. FORM STANDARD

Use:

```
React Hook Form + Zod
```

Every form:

- validates client-side,
- maps backend validation errors,
- has loading state,
- disables submit during mutation,
- shows success/error toast,
- closes dialog after success,
- invalidates relevant queries.

---

## 14. FILE UPLOAD STANDARD

Use:

```
POST /files/upload
```

Validation:

- max 10MB,
- allowed PDF, DOC, DOCX, PNG, JPG/JPEG, MP4.

UX:

- drag & drop,
- progress indicator if feasible,
- file type icon,
- file metadata preview,
- remove selected file,
- download button after upload.

---

## 15. STATUS / BADGE DESIGN

Status colors:

```
ACTIVE / PUBLISHED / PRESENT / GRADED: emerald
DRAFT: slate
COMPLETED: indigo
ARCHIVED / REMOVED: gray
INACTIVE / PAUSED: amber
SUSPENDED / ABSENT: rose
LATE / RESUBMIT_REQUESTED: orange/rose
CLOSED: violet/slate
```

Risk:

```
LOW: green
MEDIUM: amber
HIGH: red
```

---

## 16. PERFORMANCE REQUIREMENTS

Must optimize:

- code splitting by route,
- lazy load heavy charts,
- memoize expensive table columns,
- debounce search input,
- avoid unnecessary re-renders,
- cache API data with TanStack Query,
- use skeletons instead of blocking spinners,
- image/file lazy loading.

Target:

- dashboard visible quickly,
- interactions feel instant,
- no UI jank on tables.

---

## 17. ACCESSIBILITY

Must include:

- keyboard navigation,
- accessible dialogs,
- visible focus rings,
- aria labels for icon buttons,
- sufficient contrast,
- reduced motion support,
- semantic headings,
- form labels.

---

## 18. ERROR / EMPTY STATES

Beautiful empty states are required.

Examples:

- No classes: “Chưa có lớp học nào — tạo lớp đầu tiên để bắt đầu hành trình TOPIK.”
- No assignments: “Chưa có bài tập — hãy tạo bài luyện đầu tiên.”
- No submissions: “Chưa có bài nộp nào.”
- No notifications: “Hộp thư thông báo đang yên tĩnh.”
- No attendance: “Chưa có dữ liệu điểm danh.”

Do not leave blank pages.

---

## 19. MICROCOPY STYLE

Tone:

- Vietnamese,
- warm,
- professional,
- encouraging,
- concise.

Examples:

```
“Chấm ngay”
“Gửi nhắc nhở”
“Xem tiến độ”
“Đang cần chú ý”
“Lớp vận hành tốt”
“Học viên có nguy cơ”
“Deadline sắp tới”
“Bài nộp cần chấm”
```

Korean flavor can be subtle:

```
“안녕하세요!”
“오늘의 학습”
“TOPIK Journey”
```

But do not overuse Korean text.

---

## 20. IMPLEMENTATION ORDER

Work in this exact order:

### Phase 1 — Foundation

1. Project cleanup and dependency setup.
2. API client + types.
3. Auth flow.
4. App shell.
5. Role-based routing.
6. Notification bell.
7. Common components.

### Phase 2 — Teacher/Admin Core

1. Teacher dashboard.
2. Users management.
3. Classes list/detail.
4. Lessons/materials/assignments tabs.
5. Grading center.
6. Admin dashboard and scoped pages.

### Phase 3 — Student Experience

1. Student home.
2. Student classes.
3. Student assignment/submission flow.
4. Student grades/submissions.
5. Student attendance/calendar.

### Phase 4 — Advanced

1. Attendance full UI.
2. Calendar.
3. Reports.
4. CSV exports.
5. Polish, animations, responsive QA.

### Phase 5 — Final QA

1. Run typecheck.
2. Run lint.
3. Build production.
4. Fix all errors.
5. Manual route smoke test.

---

## 21. ACCEPTANCE CRITERIA

The work is complete only when:

- All 86 backend endpoints have typed frontend functions/hooks or are intentionally documented as unused.
- Login works.
- Role redirects work.
- Teacher dashboard uses real dashboard API.
- Admin dashboard is scoped.
- Student dashboard is mobile-friendly.
- All major list screens use pagination/search/filter.
- CRUD dialogs work for supported resources.
- File upload/download works.
- Notification unread/read-all works.
- Assignment progress/missing students/reminders work.
- Grading center works.
- Attendance works.
- Calendar works.
- Reports and CSV export buttons work.
- UI is beautiful, consistent, and Korea-themed.
- Loading/empty/error states exist.
- App is responsive.
- No TypeScript errors.
- Production build passes.

---

## 22. IMPORTANT CONSTRAINTS

- Do not invent backend endpoints.
- Do not add register/forgot password/refresh token UI.
- Do not bypass RBAC in frontend.
- Do not hardcode mock data if API exists.
- Mock only as temporary fallback and remove before final.
- Do not build ugly default admin UI.
- Do not ignore mobile student experience.
- Do not ignore error states.
- Do not ship with broken routes.

---

## 23. FINAL DELIVERABLE

Return/implement:

1. Full frontend code.
2. Typed API client.
3. All role-based pages.
4. Beautiful design system.
5. Dashboard charts.
6. Data tables.
7. Forms/dialogs.
8. File upload/download.
9. Notification system.
10. Attendance/calendar/reports.
11. Responsive polish.
12. Build/test verification.

At the end, run:

```bash
npm run typecheck
npm run lint
npm run build
```

If commands differ in the existing project, use the equivalent commands.

Fix every error until the frontend is clean.

---

## 24. START NOW

Start by inspecting the existing frontend project structure, dependencies, routing, and API client.

Then implement the frontend rebuild incrementally but completely.

Prioritize correctness + beauty + performance.

The final product should feel like:

```
A premium Korean LMS dashboard that a real teacher can use every day,
with Canva Pro-level polish and operational depth.
```