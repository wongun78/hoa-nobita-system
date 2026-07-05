# 📋 Phân Tích Chi Tiết Dự Án — Hoà Nobita TOPIK Platform

> **Ngày phân tích:** 2026-07-05  
> **Repo:** `hoa-nobita-system`  
> **Branch:** `main` (88 commits)

---

## 1. Tổng Quan Dự Án

**Hoà Nobita TOPIK Platform** là một nền tảng quản lý học tập tiếng Hàn (TOPIK) dành cho trung tâm/người dạy, hỗ trợ quản lý lớp học, bài tập, bài nộp, chấm điểm, điểm danh, tài liệu, thông báo và báo cáo.

### 1.1. Mục tiêu chức năng
| Chức năng | Mô tả |
|-----------|-------|
| Quản lý người dùng | Tạo/sửa/xoá tài khoản TEACHER_OWNER, CLASS_ADMIN, STUDENT |
| Quản lý lớp học | CRUD lớp, thêm/xoá học viên, quản trị viên lớp |
| Quản lý bài tập | Tạo bài tập, đa lớp, đính kèm file, hạn nộp |
| Nộp bài & chấm điểm | Học viên nộp bài (text/url/file đa tệp), giáo viên chấm điểm |
| Điểm danh | Điểm danh theo buổi học, tổng hợp tỷ lệ chuyên cần |
| Tài liệu | Upload/tìm kiếm tài liệu theo lớp/buổi học |
| Thông báo | Gửi thông báo tới lớp/người dùng cụ thể, nhắc nhở tự động |
| Dashboard | Bảng điều khiển theo vai trò (Teacher, Admin, Student) |
| Báo cáo | Xuất báo cáo, thống kê tỷ lệ nộp bài, điểm trung bình |
| Lịch học | Xem lịch học/đến hạn theo tuần/tháng |
| Nhật ký hoạt động | Ghi log hoạt động của người dùng |

### 1.2. Quy mô mã nguồn

| Metric | Giá trị |
|--------|---------|
| Backend Java files (main) | 145 |
| Backend Java files (test) | 12 |
| Backend LOC (Java) | ~10,458 |
| Frontend TS/TSX files | 141 |
| Frontend LOC (TS/TSX) | ~11,749 |
| **Tổng LOC** | **~22,200** |
| DB Migrations | 11 (V1 → V11) |
| Git commits | 88 |

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                     │
│  Vite + React 19 + TypeScript 6 + TailwindCSS 4          │
│  TanStack Query + React Router 7 + Recharts              │
│                    localhost:5173                          │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JSON)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                   │
│  Java 21 + Spring Boot 3.3.6 + Spring Security           │
│  JPA/Hibernate + Flyway + JWT (jjwt 0.12.6)             │
│  Swagger/SpringDoc 2.6.0 + Lombok                        │
│                    localhost:8080                          │
└───────────────────────┬─────────────────────────────────┘
                        │ JDBC
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL 16 (Alpine)                   │
│              Database: hoanobita (port 5432)               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Backend — Chi Tiết

### 3.1. Tech Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 3.3.6 |
| Security | Spring Security + JWT (jjwt) | 0.12.6 |
| ORM | Spring Data JPA / Hibernate | — |
| DB Migration | Flyway | (managed by Spring Boot) |
| Database | PostgreSQL | 16 |
| Validation | Bean Validation (spring-boot-starter-validation) | — |
| API Docs | SpringDoc OpenAPI (Swagger UI) | 2.6.0 |
| Build Tool | Maven (mvnw wrapper) | — |
| Testing | JUnit + H2 + Spring Security Test | — |
| Utilities | Lombok | — |
| Monitoring | Spring Boot Actuator | — |

### 3.2. Cấu trúc gói (Package Structure)

```
com.hoanobita.topikplatform/
├── TopikPlatformApplication.java          # Main entry
├── activity/                              # Nhật ký hoạt động
│   ├── ActivityController.java
│   ├── ActivityService.java
│   ├── dto/
│   ├── entity/ActivityLog.java
│   └── repository/
├── assignment/                            # Bài tập
│   ├── AssignmentAutoReminderScheduler.java  # Cron nhắc nhở
│   ├── AssignmentController.java
│   ├── AssignmentService.java
│   ├── dto/ (8 DTOs)
│   ├── entity/ (Assignment, AssignmentAutoReminder)
│   └── repository/
├── attendance/                            # Điểm danh
│   ├── AttendanceController.java
│   ├── AttendanceService.java
│   ├── dto/ (6 DTOs)
│   ├── entity/Attendance.java
│   └── repository/
├── auth/                                  # Xác thực & phân quyền
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── JwtFilter.java
│   ├── JwtService.java
│   ├── LoginRateLimiter.java              # Rate limiting
│   ├── SecurityConfig.java
│   └── dto/ (LoginRequest, LoginResponse, ChangePasswordRequest)
├── calendar/                              # Lịch học
│   ├── CalendarController.java
│   ├── CalendarService.java
│   └── dto/
├── classroom/                             # Lớp học
│   ├── ClassroomController.java
│   ├── ClassroomService.java
│   ├── KlassSpecs.java                    # JPA Specification
│   ├── dto/ (6 DTOs)
│   ├── entity/ (Klass, ClassAdmin, ClassMember)
│   └── repository/
├── common/                                # Shared utilities
│   ├── ApiResponse.java                   # Generic response wrapper
│   ├── BaseEntity.java                    # UUID + timestamps + soft delete
│   ├── BusinessException.java
│   ├── DataInitializer.java
│   ├── DevDataSeeder.java
│   ├── Enums.java
│   ├── GlobalExceptionHandler.java
│   ├── PageResponse.java
│   ├── PageableUtil.java / PaginationUtil.java
│   ├── PasswordValidator.java
│   ├── PermissionService.java
│   └── SecurityUtils.java
├── controller/report/                     # Report controller
├── dashboard/                             # Dashboard API
│   ├── DashboardController.java
│   ├── DashboardService.java
│   └── dto/repository/
├── dto/report/                            # Report DTOs
├── file/                                  # Upload/tải file
│   ├── FileController.java
│   ├── FileService.java
│   ├── dto/
│   ├── entity/FileEntity.java
│   └── repository/
├── grading/                               # Chấm điểm
│   ├── GradingController.java
│   ├── GradingService.java
│   ├── dto/
│   ├── entity/Grade.java
│   └── repository/
├── lesson/                                # Buổi học
│   ├── LessonController.java
│   ├── LessonService.java
│   ├── dto/
│   ├── entity/Lesson.java
│   └── repository/
├── material/                              # Tài liệu
│   ├── MaterialController.java
│   ├── MaterialService.java
│   ├── dto/
│   ├── entity/Material.java
│   └── repository/
├── notification/                          # Thông báo
│   ├── NotificationController.java
│   ├── NotificationService.java
│   ├── dto/
│   ├── entity/Notification.java
│   └── repository/
├── risk/                                  # Phát hiện rủi ro
│   └── RiskDetectionService.java
├── service/report/                        # Report service
├── submission/                            # Bài nộp
│   ├── SubmissionController.java
│   ├── SubmissionService.java
│   ├── dto/
│   ├── entity/Submission.java
│   └── repository/
└── user/                                  # Người dùng
    ├── MeController.java
    ├── UserController.java
    ├── UserService.java
    ├── UserSpecs.java                     # JPA Specification
    ├── dto/
    ├── entity/User.java / UserRole.java
    └── repository/
```

### 3.3. Kiến trúc Backend Pattern

| Pattern | Áp dụng |
|---------|---------|
| **Controller → Service → Repository** | Tất cả modules |
| **DTO Pattern** | Request/Response tách biệt khỏi Entity |
| **Soft Delete** | BaseEntity có `deleted_at`, query filter tự động |
| **Audit Columns** | `created_at`, `updated_at`, `created_by`, `updated_by` |
| **JPA Specifications** | UserSpecs, KlassSpecs cho dynamic query |
| **Global Exception Handler** |统一 error response qua `ApiResponse<T>` |
| **Stateless JWT Auth** | Không session, JWT filter + SecurityConfig |
| **Rate Limiting** | LoginRateLimiter cho login endpoint |
| **Auto Reminder Scheduler** | AssignmentAutoReminderScheduler (Spring @Scheduled) |
| **Data Seeder** | DevDataSeeder cho môi trường development |

### 3.4. Security

- **Authentication:** JWT (HS256) với access token, configurable expiry (default 3600s)
- **Authorization:** Role-based (TEACHER_OWNER, CLASS_ADMIN, STUDENT)
- **CORS:** Configurable origins (`app.cors.allowed-origins`)
- **Password:** BCryptPasswordEncoder
- **Rate Limiting:** Login endpoint protected
- **CORS + CSRF:** CORS enabled, CSRF disabled (stateless API)
- **Actuator:** Health endpoint public, others require auth

### 3.5. API Endpoints (Key)

| Module | Endpoints | Methods |
|--------|-----------|---------|
| Auth | `/api/v1/auth/login`, `/auth/me`, `/auth/change-password`, `/auth/logout` | POST, GET |
| Users | `/api/v1/users`, `/users/{id}`, `/users/{id}/status`, `/users/{id}/progress`, `/users/{id}/activity-logs` | CRUD + PATCH |
| Classes | `/api/v1/classes`, `/classes/{id}`, `/classes/{id}/students`, `/classes/{id}/admins`, `/classes/{id}/stats` | CRUD + bulk |
| Lessons | `/api/v1/classes/{id}/lessons`, `/lessons/{id}` | CRUD |
| Materials | `/api/v1/classes/{id}/materials`, `/materials/{id}` | CRUD + visibility |
| Assignments | `/api/v1/classes/{id}/assignments`, `/assignments/{id}`, `/assignments/{id}/publish`, `/assignments/{id}/close`, `/assignments/{id}/copy`, `/assignments/{id}/missing-students`, `/assignments/{id}/send-reminder` | CRUD + workflow |
| Submissions | `/api/v1/submissions`, `/submissions/{id}` | CRUD |
| Grading | `/api/v1/grades`, `/grades/{id}` | CRUD |
| Attendance | `/api/v1/attendance`, `/attendance/{id}` | CRUD + bulk |
| Files | `/api/v1/files/upload`, `/files/{id}/download` | POST, GET |
| Dashboard | `/api/v1/dashboard/teacher`, `/dashboard/admin`, `/dashboard/student` | GET |
| Notifications | `/api/v1/notifications`, `/notifications/{id}` | CRUD |
| Calendar | `/api/v1/calendar/events` | GET |
| Activity | `/api/v1/activity-logs` | GET |
| Reports | `/api/v1/reports/*` | GET |

---

## 4. Database Schema

### 4.1. Core Tables (V1)

| Table | Mô tả | Key Columns |
|-------|-------|-------------|
| `roles` | Vai trò hệ thống | id, name |
| `users` | Người dùng | id, full_name, email, phone, password_hash, status, first_login, avatar_url |
| `user_roles` | Quan hệ user-role | user_id, role_id |
| `classes` | Lớp học | id, name, code, level_from/to, status, teacher_id, start/end_date |
| `class_admins` | Admin lớp | class_id, admin_id |
| `class_members` | Học viên lớp | id, class_id, student_id, status, joined_at |
| `lessons` | Buổi học | id, class_id, title, lesson_date, order_index, status |
| `files` | File upload | id, original_file_name, stored_file_name, file_key, file_size, content_type |
| `materials` | Tài liệu | id, class_id, lesson_id, file_id, title, external_url, visible |
| `assignments` | Bài tập | id, class_id, lesson_id, title, instruction, due_at, max_score, status, allow_resubmit |
| `submissions` | Bài nộp | id, assignment_id, student_id, content_text, content_url, file_id, status |
| `grades` | Điểm | id, submission_id, score, feedback, graded_by |
| `notifications` | Thông báo | id, title, content, target_type, target_id |

### 4.2. Migrations bổ sung (V2–V11)

| Migration | Thay đổi |
|-----------|----------|
| V2 | Seed data mẫu |
| V3 | Align audit columns cho submissions |
| V4 | Bảng `activity_logs` |
| V5 | Bảng `notification_reads`, `auto_reminder_logs` |
| V6 | Bảng attendance + student_code |
| V7 | Assignment skill attachment link |
| V8 | Submission feedback attachment |
| V9 | Performance indexes |
| V10 | Assignment file_ids (multi-file) |
| V11 | Submission file_ids (multi-file) |

### 4.3. Indexes

- Partial indexes trên `users(email)`, `users(phone)`, `classes(code)` với `WHERE deleted_at IS NULL`
- Indexes cho foreign keys và query patterns phổ biến
- Performance indexes (V9)

### 4.4. Soft Delete Strategy

Tất cả bảng chính sử dụng soft delete (`deleted_at TIMESTAMP`), BaseEntity tự động filter trong JPA queries.

---

## 5. Frontend — Chi Tiết

### 5.1. Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | 6.0 |
| Framework | React | 19.2 |
| Build Tool | Vite | 8.1 |
| CSS | TailwindCSS | 4.3 |
| Routing | React Router | 7.18 |
| Data Fetching | TanStack React Query | 5.101 |
| HTTP Client | Axios | 1.18 |
| Forms | React Hook Form + Zod | 7.80 / 4.4 |
| Charts | Recharts | 3.9 |
| Icons | Lucide React | 1.21 |
| Linting | oxlint | 1.69 |

### 5.2. Cấu trúc thư mục

```
frontend/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Legacy app
├── index.css                   # Global styles
├── app/
│   ├── providers.tsx           # Legacy providers
│   └── router.tsx              # Legacy router
├── components/                 # Legacy UI components
│   ├── layout/app-shell.tsx
│   ├── system/states.tsx
│   └── ui/ (badge, button, card, dialog, form, input, select, tabs, textarea, toast)
├── features/                   # Legacy feature modules (13 modules)
│   ├── activity/
│   ├── assignments/
│   ├── auth/
│   ├── classes/
│   ├── dashboard/
│   ├── files/
│   ├── grading/
│   ├── lessons/
│   ├── materials/
│   ├── notifications/
│   ├── reports/
│   ├── submissions/
│   └── users/
├── i18n/                       # Internationalization (vi, ko)
│   ├── i18n-context.ts
│   ├── i18n-provider.tsx
│   ├── locales/ (vi.ts, ko.ts)
│   └── use-i18n.ts
├── lib/                        # Utilities
│   ├── api.ts
│   ├── api-error.ts
│   ├── query-keys.ts
│   └── utils.ts
├── pages/                      # Legacy pages (23 pages)
└── rebuild/                    # ✨ REBUILD — Giao diện mới
    ├── auth/                   # Auth context, guards, role-redirect
    ├── components/             # Shared components (5)
    ├── core/                   # API client, types, HTTP, token
    ├── layout/                 # App shell + UI primitives
    ├── pages/                  # Pages mới (27 pages)
    └── router.tsx              # Router mới
```

### 5.3. Kiến trúc Frontend

#### 5.3.1. Hai hệ thống song song

Frontend có **2 hệ thống router** song song:
- **Legacy** (`src/app/router.tsx`, `src/pages/`, `src/features/`) — Giao diện cũ
- **Rebuild** (`src/rebuild/router.tsx`, `src/rebuild/pages/`) — Giao diện mới (đang phát triển)

#### 5.3.2. Rebuild Architecture

```
rebuild/
├── core/
│   ├── api.ts         # API client (all endpoints)
│   ├── http.ts        # Axios instance + interceptors
│   ├── token.ts       # JWT token management
│   └── types.ts       # TypeScript types (25+ types)
├── auth/
│   ├── auth-context.ts
│   ├── auth-provider.tsx
│   ├── guards.tsx      # RequireAuth, RequireRole
│   ├── role-redirect.ts
│   └── use-auth.ts
├── components/
│   ├── error-boundary.tsx
│   ├── file-preview-modal.tsx
│   ├── foundation.tsx     # SkeletonCard, RoleBadge, etc.
│   ├── multi-file-upload.tsx
│   └── student-file-upload.tsx
├── layout/
│   ├── app-shell.tsx      # Sidebar + header + navigation
│   └── ui.tsx             # Button, Input, etc.
└── pages/                 # 27 page components
```

#### 5.3.3. Navigation Structure (Rebuild)

| Vai trò | Routes |
|---------|--------|
| **TEACHER_OWNER** | `/teacher/dashboard`, `/teacher/users`, `/teacher/classes`, `/teacher/assignments`, `/teacher/grading`, `/teacher/materials`, `/teacher/notifications`, `/teacher/attendance`, `/teacher/calendar`, `/teacher/reports` |
| **CLASS_ADMIN** | `/admin/dashboard`, `/admin/classes`, `/admin/assignments`, `/admin/grading`, `/admin/materials`, `/admin/notifications`, `/admin/attendance`, `/admin/calendar`, `/admin/reports` |
| **STUDENT** | `/student/home`, `/student/classes`, `/student/assignments`, `/student/submissions`, `/student/grades`, `/student/attendance`, `/student/materials`, `/student/calendar`, `/student/notifications`, `/student/profile` |

#### 5.3.4. Code Splitting

- Lazy loading với retry mechanism (`lazyWithRetry`)
- Manual chunks: `vendor-react`, `vendor-tanstack`, `vendor-charts`, `vendor-icons`, `vendor-core`

### 5.4. API Client (`rebuild/core/api.ts`)

API client đầy đủ bao gồm:
- **Auth:** login, me, updateMe, changePassword, logout
- **Dashboard:** teacher, admin, student
- **Users:** CRUD + status + progress + activity logs
- **Classes:** CRUD + students (bulk, code, status) + admins + stats + export CSV
- **Lessons:** CRUD by class
- **Materials:** CRUD + visibility toggle
- **Assignments:** CRUD + multi-class + publish/close/copy + missing students + reminders
- **Submissions:** CRUD + multi-file
- **Grading:** CRUD
- **Attendance:** CRUD + bulk + summary
- **Files:** upload + download
- **Notifications:** CRUD
- **Calendar:** events
- **Activity:** logs
- **Reports:** various

---

## 6. DevOps & Deployment

### 6.1. Docker

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL | `postgres:16-alpine` | 5432 |
| Backend | `eclipse-temurin:21-jdk` → `eclipse-temurin:21-jre` | 8080 |
| Frontend | `node:22-alpine` → `nginx:1.27-alpine` | 80 |

### 6.2. Docker Compose

Hiện tại chỉ có PostgreSQL trong `docker-compose.yml`. Backend và Frontend có Dockerfile riêng nhưng chưa tích hợp vào docker-compose.

### 6.3. Scripts

| Script | Chức năng |
|--------|-----------|
| `seed-demo-data.sh` | Seed dữ liệu demo |
| `reset-demo-db.sh` | Reset database demo |
| `verify-demo-data.sh` | Kiểm tra dữ liệu demo |
| `test-api.sh` | Test API endpoints |

### 6.4. Environment Variables

| Variable | Default | Mô tả |
|----------|---------|-------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/hoanobita` | Database URL |
| `DB_USER` | `hoanobita` | Database user |
| `DB_PASSWORD` | `hoanobita` | Database password |
| `JWT_SECRET` | (dev default) | JWT signing key |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed origins |
| `APP_SEED_ENABLED` | `false` | Enable data seeder |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Frontend API base URL |

---

## 7. Testing

### 7.1. Backend Tests

- **Framework:** JUnit + Spring Boot Test + Spring Security Test
- **Test Database:** H2 in-memory (PostgreSQL mode)
- **Test files:** 12 Java files trong `src/test/`
- **Integration tests:** Uses `**/*IT.java` pattern (maven-failsafe-plugin)

### 7.2. Frontend Tests

- Chưa có test framework được cấu hình (không có vitest/jest trong package.json)

---

## 8. Tiến Độ Phát Triển (Sprint History)

| Sprint | Nội dung | Trạng thái |
|--------|----------|------------|
| Sprint 1-2 | Initial commit, schema setup | ✅ |
| Sprint 3 | Assignments CRUD & Workflow | ✅ |
| Sprint 4 | Lessons and Materials CRUD | ✅ |
| Sprint 5 | Files Module + API tests | ✅ |
| Sprint 6 | User Detail Page + Student Progress | ✅ |
| Sprint 7 | Submissions Detail, Edit, Delete | ✅ |
| Sprint 10 | Activity log integration | ✅ |
| Phase 2 | Rebuild UI, multi-file submission, attendance, calendar, reports, student dashboard | ✅ (gần đây nhất) |

### 8.1. Recent Features (Latest commits)

1. Multi-file submission support (max 5 files)
2. Export assignment submissions as ZIP
3. Attendance marking page
4. Student dashboard + home page
5. Calendar page
6. Reports page
7. File preview with authenticated blob URLs
8. Auto reminder scheduler
9. Vietnamese i18n sync
10. Mobile responsiveness improvements

---

## 9. Điểm Mạnh

| # | Điểm mạnh |
|---|-----------|
| 1 | **Kiến trúc sạch:** Controller → Service → Repository pattern thống nhất |
| 2 | **Soft delete toàn diện:** BaseEntity với deleted_at, automatic filtering |
| 3 | **RBAC đầy đủ:** 3 roles với guards ở cả backend và frontend |
| 4 | **API client hoàn chỉnh:** Typed API client với tất cả endpoints |
| 5 | **Database migrations có tổ chức:** 11 migrations có version control |
| 6 | **Code splitting:** Lazy loading + manual chunks tối ưu bundle |
| 7 | **Multi-language:** i18n support (Vietnamese, Korean) |
| 8 | **Auto reminders:** Scheduled task nhắc nhở nộp bài |
| 9 | **Swagger API docs:** SpringDoc OpenAPI integration |
| 10 | **File upload system:** Multi-file support với validation |

---

## 10. Điểm Cần Cải Thiện

| # | Vấn đề | Mức độ | Đề xuất |
|---|--------|--------|---------|
| 1 | **Frontend tests:** Không có test framework | 🔴 High | Thêm Vitest + React Testing Library |
| 2 | **Backend tests:** Chỉ 12 test files cho 145 source files | 🟡 Medium | Tăng coverage, đặc biệt integration tests |
| 3 | **Docker Compose:** Chỉ có PostgreSQL, chưa có full stack | 🟡 Medium | Thêm backend + frontend services |
| 4 | **Legacy/Rebuild song song:** 2 hệ thống router cùng tồn tại | 🟡 Medium | Hoàn thành migration, xoá legacy code |
| 5 | **Error handling:** ApiResponse wrapper nhưng chưa统一 error codes | 🟢 Low | Define error code enum |
| 6 | **Logging:** Chỉ DEBUG level, chưa có structured logging | 🟢 Low | Thêm JSON structured logging |
| 7 | **CI/CD:** Không có pipeline configuration | 🟡 Medium | Thêm GitHub Actions |
| 8 | **API versioning:** Hardcoded `/api/v1` | 🟢 Low | Acceptable cho giai đoạn hiện tại |
| 9 | **File storage:** Local filesystem only | 🟢 Low | Consider S3/Cloud storage cho production |
| 10 | **WebSocket:** Chưa có real-time notifications | 🟢 Low | Consider WebSocket cho notifications |

---

## 11. Dependency Summary

### Backend (pom.xml)
- Spring Boot 3.3.6 (web, security, data-jpa, validation, actuator)
- PostgreSQL + Flyway
- JWT (jjwt 0.12.6)
- SpringDoc OpenAPI 2.6.0
- Lombok
- H2 (test scope)

### Frontend (package.json)
- React 19.2 + React DOM 19.2
- React Router 7.18
- TanStack React Query 5.101
- Axios 1.18
- TailwindCSS 4.3
- React Hook Form 7.80 + Zod 4.4
- Recharts 3.9
- Lucide React 1.21
- TypeScript 6.0
- Vite 8.1

---

## 12. Kết Luận

Dự án **Hoà Nobita TOPIK Platform** đã phát triển qua **88 commits** với kiến trúc **full-stack Java + React** hiện đại. Backend sử dụng Spring Boot 3.3.6 với Java 21, frontend sử dụng React 19 + TypeScript 6 + Vite 8. Hệ thống có **11 database migrations**, **145 backend source files** (~10.5K LOC) và **141 frontend source files** (~11.7K LOC).

Dự án đang trong giai đoạn **rebuild UI** với hệ thống router mới (`src/rebuild/`) song song với legacy code. Các tính năng cốt lõi đã hoàn thành: quản lý lớp học, bài tập, nộp bài, chấm điểm, điểm danh, tài liệu, thông báo, dashboard, lịch học và báo cáo.

**Ưu tiên tiếp theo nên là:**
1. Thêm automated tests (frontend + tăng backend coverage)
2. Hoàn thành migration từ legacy → rebuild UI
3. Cấu hình CI/CD pipeline
4. Tích hợp Docker Compose full-stack cho development
