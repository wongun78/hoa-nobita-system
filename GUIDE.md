# 📖 Hướng Dẫn Sử Dụng — Hoà Nobita TOPIK Platform

> **Phiên bản:** v0.0.1-SNAPSHOT  
> **Cập nhật:** 2026-07-06  
> **Tổng LOC:** ~22,200 (Backend ~10,500 + Frontend ~11,700)  
> **Git Commits:** 88  

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Tech Stack](#2-tech-stack)
3. [Kiến Trúc Hệ Thống](#3-kiến-trúc-hệ-thống)
4. [Yêu Cầu Hệ Thống](#4-yêu-cầu-hệ-thống)
5. [Hướng Dẫn Cài Đặt](#5-hướng-dẫn-cài-đặt)
6. [Chạy Dự Án](#6-chạy-dự-án)
7. [Cấu Trúc Dự Án](#7-cấu-trúc-dự-án)
8. [Backend — Chi Tiết](#8-backend--chi-tiết)
9. [Frontend — Chi Tiết](#9-frontend--chi-tiết)
10. [Cơ Sở Dữ Liệu](#10-cơ-sở-dữ-liệu)
11. [API Reference](#11-api-reference)
12. [Tài Khoản Demo](#12-tài-khoản-demo)
13. [Scripts & Công Cụ](#13-scripts--công-cụ)
14. [Biến Môi Trường](#14-biến-môi-trường)
15. [Docker & Triển Khai](#15-docker--triển-khai)
16. [Testing](#16-testing)
17. [Swagger / API Docs](#17-swagger--api-docs)
18. [Xử Lý Sự Cố](#18-xử-lý-sự-cố)
19. [Roadmap](#19-roadmap)

---

## 1. Tổng Quan

**Hoà Nobita TOPIK Platform** là nền tảng quản lý học tập tiếng Hàn (TOPIK) dành cho trung tâm/người dạy, hỗ trợ:

| Chức năng | Mô tả |
|-----------|-------|
| 👤 Quản lý người dùng | Tạo/sửa/xoá tài khoản TEACHER_OWNER, CLASS_ADMIN, STUDENT |
| 🏫 Quản lý lớp học | CRUD lớp, thêm/xoá học viên, quản trị viên lớp |
| 📝 Quản lý bài tập | Tạo bài tập đa lớp, đính kèm file, hạn nộp |
| ✅ Nộp bài & chấm điểm | Học viên nộp bài (text/URL/file đa tệp), giáo viên chấm điểm |
| 📋 Điểm danh | Điểm danh theo buổi học, tổng hợp tỷ lệ chuyên cần |
| 📚 Tài liệu | Upload/tìm kiếm tài liệu theo lớp/buổi học |
| 🔔 Thông báo | Gửi thông báo tới lớp/người dùng, nhắc nhở tự động |
| 📊 Dashboard | Bảng điều khiển theo vai trò (Teacher, Admin, Student) |
| 📈 Báo cáo | Xuất báo cáo, thống kê tỷ lệ nộp bài, điểm trung bình |
| 📅 Lịch học | Xem lịch học/đến hạn theo tuần/tháng |
| 📜 Nhật ký hoạt động | Ghi log hoạt động của người dùng |

---

## 2. Tech Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 3.3.6 |
| Security | Spring Security + JWT (jjwt) | 0.12.6 |
| ORM | Spring Data JPA / Hibernate | — |
| DB Migration | Flyway | managed by Spring Boot |
| Database | PostgreSQL | 16 |
| Validation | Bean Validation | — |
| API Docs | SpringDoc OpenAPI (Swagger UI) | 2.6.0 |
| Build Tool | Maven (mvnw wrapper) | — |
| Testing | JUnit + H2 + Spring Security Test | — |
| Utilities | Lombok | — |
| Monitoring | Spring Boot Actuator | — |
| Cloud Storage | Google Cloud Storage | 2.47.0 |

### Frontend

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

### DevOps

| Component | Technology |
|-----------|-----------|
| Container | Docker (multi-stage build) |
| Orchestration | Docker Compose |
| IaC | Terraform (GCP modules) |
| Cloud | Google Cloud Run + Cloud SQL + Artifact Registry + GCS |
| Reverse Proxy | Nginx (frontend) |

---

## 3. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  Vite + React 19 + TypeScript 6 + TailwindCSS 4          │
│  TanStack Query + React Router 7 + Recharts              │
│                    localhost:5173                          │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JSON)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Spring Boot)                     │
│  Java 21 + Spring Boot 3.3.6 + Spring Security           │
│  JPA/Hibernate + Flyway + JWT (jjwt 0.12.6)             │
│  Swagger/SpringDoc 2.6.0 + Lombok                        │
│                    localhost:8080                          │
└───────────────────────┬─────────────────────────────────┘
                        │ JDBC
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL 16 (Alpine)                     │
│              Database: hoanobita (port 5432)               │
└─────────────────────────────────────────────────────────┘
```

### Backend Architecture Pattern

| Pattern | Áp dụng |
|---------|---------|
| Controller → Service → Repository | Tất cả modules |
| DTO Pattern | Request/Response tách biệt khỏi Entity |
| Soft Delete | BaseEntity có `deleted_at`, query filter tự động |
| Audit Columns | `created_at`, `updated_at`, `created_by`, `updated_by` |
| JPA Specifications | UserSpecs, KlassSpecs cho dynamic query |
| Global Exception Handler | Unified error response qua `ApiResponse<T>` |
| Stateless JWT Auth | Không session, JWT filter + SecurityConfig |
| Rate Limiting | LoginRateLimiter cho login endpoint |
| Auto Reminder Scheduler | AssignmentAutoReminderScheduler (Spring @Scheduled) |

### Security

- **Authentication:** JWT (HS256) với access token, configurable expiry (default 3600s)
- **Authorization:** Role-based (TEACHER_OWNER, CLASS_ADMIN, STUDENT)
- **CORS:** Configurable origins
- **Password:** BCryptPasswordEncoder
- **Rate Limiting:** Login endpoint protected
- **CSRF:** Disabled (stateless API)

---

## 4. Yêu Cầu Hệ Thống

| Requirement | Version |
|-------------|---------|
| Java JDK | 21+ |
| Node.js | 22+ |
| npm | 10+ |
| Maven | 3.9+ (hoặc dùng `mvnw`) |
| PostgreSQL | 16+ |
| Docker (optional) | 24+ |
| Docker Compose (optional) | 2+ |

---

## 5. Hướng Dẫn Cài Đặt

### 5.1. Clone Repository

```bash
git clone <repository-url>
cd hoa-nobita-system
```

### 5.2. Cài Backend Dependencies

```bash
cd backend
./mvnw dependency:resolve
```

### 5.3. Cài Frontend Dependencies

```bash
cd frontend
npm install
```

### 5.4. Setup Database

**Option A — Docker (khuyên dùng):**

```bash
docker run -d \
  --name hoanobita-postgres \
  -e POSTGRES_DB=hoanobita \
  -e POSTGRES_USER=hoanobita \
  -e POSTGRES_PASSWORD=hoanobita \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option B — PostgreSQL local:**

Tạo database và user:

```sql
CREATE DATABASE hoanobita;
CREATE USER hoanobita WITH PASSWORD 'hoanobita';
GRANT ALL PRIVILEGES ON DATABASE hoanobita TO hoanobita;
```

Database schema sẽ được tự động migrate bởi Flyway khi backend khởi động.

---

## 6. Chạy Dự Án

### 6.1. Chạy bằng Docker Compose (khuyên dùng)

```bash
# Khởi động toàn bộ stack (PostgreSQL + Backend + Frontend)
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5432 |

### 6.2. Chạy Development (riêng từng phần)

**Terminal 1 — Backend:**

```bash
cd backend
./mvnw spring-boot:run \
  -Dspring-boot.run.arguments="--app.seed.enabled=true"
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

### 6.3. Seed dữ liệu demo

```bash
# Sau khi backend đã khởi động
cd scripts
chmod +x seed-demo-data.sh
./seed-demo-data.sh
```

Hoặc khi chạy backend với flag:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=true"
```

---

## 7. Cấu Trúc Dự Án

```
hoa-nobita-system/
├── PROJECT_ANALYSIS.md          # Phân tích chi tiết dự án
├── CREDENTIALS.md               # Tài khoản demo
├── GUIDE.md                     # ← File này
├── deploy.sh                    # Script deploy GCP
├── docker-compose.yml           # Docker Compose (full stack)
│
├── backend/                     # Spring Boot Backend
│   ├── Dockerfile
│   ├── mvnw / mvnw.cmd         # Maven wrapper
│   ├── pom.xml                  # Maven dependencies
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hoanobita/topikplatform/
│   │   │   │   ├── TopikPlatformApplication.java
│   │   │   │   ├── activity/         # Nhật ký hoạt động
│   │   │   │   ├── assignment/       # Bài tập
│   │   │   │   ├── attendance/       # Điểm danh
│   │   │   │   ├── auth/             # Xác thực & phân quyền
│   │   │   │   ├── calendar/         # Lịch học
│   │   │   │   ├── classroom/        # Lớp học
│   │   │   │   ├── common/           # Shared utilities
│   │   │   │   ├── controller/report/ # Report
│   │   │   │   ├── dashboard/        # Dashboard API
│   │   │   │   ├── file/             # Upload/tải file
│   │   │   │   ├── grading/          # Chấm điểm
│   │   │   │   ├── lesson/           # Buổi học
│   │   │   │   ├── material/         # Tài liệu
│   │   │   │   ├── notification/     # Thông báo
│   │   │   │   ├── risk/             # Phát hiện rủi ro
│   │   │   │   ├── submission/       # Bài nộp
│   │   │   │   └── user/             # Người dùng
│   │   │   └── resources/
│   │   │       ├── application.yml   # Cấu hình chính
│   │   │       └── db/migration/     # Flyway migrations (V1→V11)
│   │   └── test/                     # JUnit tests
│   └── uploads/                      # File uploads (local storage)
│
├── frontend/                    # React + Vite Frontend
│   ├── Dockerfile
│   ├── nginx.conf.template      # Nginx config (production)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Root component
│       ├── index.css            # Global styles
│       ├── app/                 # Router & providers (legacy)
│       ├── components/          # UI primitives (legacy)
│       ├── features/            # Feature modules (legacy)
│       ├── i18n/                # i18n (vi, ko)
│       ├── lib/                 # Utilities (api, query-keys)
│       ├── pages/               # Pages (legacy)
│       └── rebuild/             # ✨ Giao diện mới (active)
│           ├── auth/            # Auth context, guards
│           ├── components/      # Shared components
│           ├── core/            # API client, types, HTTP
│           ├── layout/          # App shell + UI primitives
│           ├── pages/           # 27 page components
│           └── router.tsx       # Router mới
│
├── scripts/                     # Utility scripts
│   ├── generate-seed.py         # Tạo seed data
│   ├── seed-demo-data.sh        # Seed demo data
│   ├── reset-demo-db.sh         # Reset demo DB
│   ├── test-api.sh              # Test API endpoints
│   └── verify-demo-data.sh      # Verify demo data
│
└── terraform/                   # GCP Infrastructure as Code
    ├── main.tf                  # Root module
    ├── variables.tf
    ├── outputs.tf
    ├── versions.tf
    ├── backend.tf
    ├── environments/            # Per-env tfvars
    └── modules/
        ├── artifact_registry/
        ├── cloud_run/
        ├── database/
        ├── gcs_uploads/
        ├── iam/
        ├── networking/
        └── secrets/
```

---

## 8. Backend — Chi Tiết

### 8.1. Package Structure

```
com.hoanobita.topikplatform/
├── TopikPlatformApplication.java          # Main entry
├── activity/                              # Activity logging
│   ├── ActivityController.java            # GET /api/v1/activity-logs
│   ├── ActivityService.java
│   ├── dto/
│   ├── entity/ActivityLog.java
│   └── repository/
├── assignment/                            # Assignments
│   ├── AssignmentAutoReminderScheduler.java # Cron reminders
│   ├── AssignmentController.java
│   ├── AssignmentService.java
│   ├── dto/ (8 DTOs)
│   ├── entity/ (Assignment, AssignmentAutoReminder)
│   └── repository/
├── attendance/                            # Attendance
│   ├── AttendanceController.java
│   ├── AttendanceService.java
│   ├── dto/ (6 DTOs)
│   ├── entity/Attendance.java
│   └── repository/
├── auth/                                  # Authentication
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── JwtFilter.java
│   ├── JwtService.java
│   ├── LoginRateLimiter.java
│   ├── SecurityConfig.java
│   └── dto/ (LoginRequest, LoginResponse, ChangePasswordRequest)
├── calendar/                              # Calendar
│   ├── CalendarController.java
│   ├── CalendarService.java
│   └── dto/
├── classroom/                             # Classrooms
│   ├── ClassroomController.java
│   ├── ClassroomService.java
│   ├── KlassSpecs.java                    # JPA Specification
│   ├── dto/ (6 DTOs)
│   ├── entity/ (Klass, ClassAdmin, ClassMember)
│   └── repository/
├── common/                                # Shared
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
├── dashboard/                             # Dashboard
├── file/                                  # File upload/download
├── grading/                               # Grading
├── lesson/                                # Lessons
├── material/                              # Materials
├── notification/                          # Notifications
├── risk/                                  # Risk detection
├── submission/                            # Submissions
└── user/                                  # Users
```

### 8.2. BaseEntity (Soft Delete + Audit)

Tất cả entities kế thừa `BaseEntity`:

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
```

### 8.3. Build & Run Commands

```bash
# Build
./mvnw clean package

# Build skip tests
./mvnw clean package -DskipTests

# Run
./mvnw spring-boot:run

# Run with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Run tests
./mvnw test

# Run integration tests
./mvnw verify

# Clean
./mvnw clean
```

---

## 9. Frontend — Chi Tiết

### 9.1. Hai Hệ Thống Song Song

Frontend có **2 hệ thống router** song song:

| Hệ thống | Router | Pages | Status |
|----------|--------|-------|--------|
| **Legacy** | `src/app/router.tsx` | `src/pages/`, `src/features/` | Deprecated |
| **Rebuild** ✨ | `src/rebuild/router.tsx` | `src/rebuild/pages/` | Active |

### 9.2. Rebuild Architecture

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

### 9.3. Navigation theo Vai Trò

**TEACHER_OWNER:**

| Route | Page |
|-------|------|
| `/teacher/dashboard` | Dashboard tổng quan |
| `/teacher/users` | Quản lý người dùng |
| `/teacher/users/:id` | Chi tiết người dùng |
| `/teacher/classes` | Quản lý lớp học |
| `/teacher/classes/:classId` | Chi tiết lớp học |
| `/teacher/assignments` | Quản lý bài tập |
| `/teacher/grading` | Chấm điểm |
| `/teacher/materials` | Tài liệu |
| `/teacher/notifications` | Thông báo |
| `/teacher/attendance` | Điểm danh |
| `/teacher/calendar` | Lịch học |
| `/teacher/reports` | Báo cáo |

**CLASS_ADMIN:**

| Route | Page |
|-------|------|
| `/admin/dashboard` | Dashboard |
| `/admin/classes` | Quản lý lớp |
| `/admin/classes/:classId` | Chi tiết lớp |
| `/admin/assignments` | Bài tập |
| `/admin/grading` | Chấm điểm |
| `/admin/materials` | Tài liệu |
| `/admin/notifications` | Thông báo |
| `/admin/attendance` | Điểm danh |
| `/admin/calendar` | Lịch |
| `/admin/reports` | Báo cáo |

**STUDENT:**

| Route | Page |
|-------|------|
| `/student/home` | Trang chủ |
| `/student/classes` | Lớp học |
| `/student/classes/:id` | Chi tiết lớp |
| `/student/assignments` | Bài tập |
| `/student/assignments/:id` | Chi tiết bài tập |
| `/student/assignments/:id/submit` | Nộp bài |
| `/student/submissions` | Bài đã nộp |
| `/student/grades` | Điểm số |
| `/student/attendance` | Điểm danh |
| `/student/materials` | Tài liệu |
| `/student/calendar` | Lịch |
| `/student/notifications` | Thông báo |
| `/student/profile` | Hồ sơ |

### 9.4. i18n (Đa ngôn ngữ)

Hỗ trợ 2 ngôn ngữ: **Tiếng Việt (vi)** và **Tiếng Hàn (ko)**.

```typescript
// src/i18n/locales/vi.ts — Vietnamese translations
// src/i18n/locales/ko.ts — Korean translations
```

### 9.5. NPM Scripts

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run typecheck    # TypeScript type checking
npm run lint         # oxlint linting
npm run preview      # Preview production build
```

---

## 10. Cơ Sở Dữ Liệu

### 10.1. Core Tables

| Table | Mô tả | Key Columns |
|-------|-------|-------------|
| `roles` | Vai trò hệ thống | id, name |
| `users` | Người dùng | id, full_name, email, phone, password_hash, status, avatar_url |
| `user_roles` | Quan hệ user-role | user_id, role_id |
| `classes` | Lớp học | id, name, code, level_from/to, status, teacher_id, start/end_date |
| `class_admins` | Admin lớp | class_id, admin_id |
| `class_members` | Học viên lớp | id, class_id, student_id, status, joined_at |
| `lessons` | Buổi học | id, class_id, title, lesson_date, order_index, status |
| `files` | File upload | id, original_file_name, stored_file_name, file_key, file_size |
| `materials` | Tài liệu | id, class_id, lesson_id, file_id, title, external_url, visible |
| `assignments` | Bài tập | id, class_id, lesson_id, title, instruction, due_at, max_score, status |
| `submissions` | Bài nộp | id, assignment_id, student_id, content_text, content_url, file_id, status |
| `grades` | Điểm | id, submission_id, score, feedback, graded_by |
| `notifications` | Thông báo | id, title, content, target_type, target_id |
| `attendance` | Điểm danh | id, class_id, lesson_id, student_id, status, recorded_at |
| `activity_logs` | Nhật ký | id, user_id, action, entity_type, entity_id, details |
| `notification_reads` | Đã đọc thông báo | notification_id, user_id, read_at |
| `auto_reminder_logs` | Log nhắc nhở | assignment_id, sent_at |

### 10.2. Migrations (Flyway)

| Migration | Nội dung |
|-----------|----------|
| V1 | Initial schema (core tables) |
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

### 10.3. Soft Delete Strategy

Tất cả bảng chính sử dụng soft delete (`deleted_at TIMESTAMP`). BaseEntity tự động filter trong JPA queries.

### 10.4. Indexes

- Partial indexes trên `users(email)`, `users(phone)`, `classes(code)` với `WHERE deleted_at IS NULL`
- Indexes cho foreign keys và query patterns phổ biến
- Performance indexes (V9)

---

## 11. API Reference

### 11.1. Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8080/api/v1` |
| Docker | `http://localhost:8080/api/v1` |
| Production | `https://<cloud-run-url>/api/v1` |

### 11.2. Authentication

```bash
# Login
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "hoateacher",
  "password": "Password123!"
}

# Response
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}

# Use token in subsequent requests
Authorization: Bearer <token>
```

### 11.3. Endpoints Overview

| Module | Endpoint | Methods |
|--------|----------|---------|
| **Auth** | `/api/v1/auth/login`, `/auth/me`, `/auth/change-password`, `/auth/logout` | POST, GET |
| **Users** | `/api/v1/users`, `/users/{id}`, `/users/{id}/status` | CRUD + PATCH |
| **Classes** | `/api/v1/classes`, `/classes/{id}`, `/classes/{id}/students`, `/classes/{id}/admins`, `/classes/{id}/stats` | CRUD + bulk |
| **Lessons** | `/api/v1/classes/{id}/lessons`, `/lessons/{id}` | CRUD |
| **Materials** | `/api/v1/classes/{id}/materials`, `/materials/{id}` | CRUD + visibility |
| **Assignments** | `/api/v1/classes/{id}/assignments`, `/assignments/{id}`, `/assignments/{id}/publish`, `/assignments/{id}/close`, `/assignments/{id}/copy`, `/assignments/{id}/send-reminder` | CRUD + workflow |
| **Submissions** | `/api/v1/submissions`, `/submissions/{id}` | CRUD |
| **Grading** | `/api/v1/grades`, `/grades/{id}` | CRUD |
| **Attendance** | `/api/v1/attendance`, `/attendance/{id}` | CRUD + bulk |
| **Files** | `/api/v1/files/upload`, `/files/{id}/download` | POST, GET |
| **Dashboard** | `/api/v1/dashboard/teacher`, `/dashboard/admin`, `/dashboard/student` | GET |
| **Notifications** | `/api/v1/notifications`, `/notifications/{id}` | CRUD |
| **Calendar** | `/api/v1/calendar/events` | GET |
| **Activity** | `/api/v1/activity-logs` | GET |
| **Reports** | `/api/v1/reports/*` | GET |

### 11.4. Pagination

Tất cả list endpoints hỗ trợ pagination:

```
GET /api/v1/users?page=0&size=20&sort=createdAt,desc
```

Response:
```json
{
  "data": {
    "content": [...],
    "totalElements": 155,
    "totalPages": 8,
    "number": 0,
    "size": 20
  }
}
```

### 11.5. Response Format

Tất cả responses sử dụng `ApiResponse<T>` wrapper:

```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2026-07-06T10:30:00Z"
}
```

Error:
```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must not be blank" }
  ],
  "timestamp": "2026-07-06T10:30:00Z"
}
```

---

## 12. Tài Khoản Demo

### 12.1. Quản trị viên

| Username | Mật khẩu | Vai trò | Quản lý lớp |
|----------|----------|---------|-------------|
| `hoateacher` | `Password123!` | TEACHER_OWNER | Tất cả |
| `kienadmin` | `Password123!` | CLASS_ADMIN | D34, C34, LD |
| `quanadmin` | `Password123!` | CLASS_ADMIN | S34, Q56, LD |

### 12.2. Học viên (mẫu)

Hệ thống có **155 học viên** được seed. Mật khẩu học viên theo format:

```
Username: {ma_sv}_{ten_viettat_lowercase}
Password: {MA_SV}123456@
```

Ví dụ:
| Mã SV | Username | Password |
|-------|----------|----------|
| L01 | `l01_ntta` | `L01123456@` |
| L02 | `l02_nvk` | `L02123456@` |
| D01 | `d01_...` | `D01123456@` |

### 12.3. Danh sách lớp học

| Mã lớp | Tên lớp | Level | Số học viên |
|--------|---------|-------|-------------|
| LD | Luyện Đề | TOPIK 3-6 | 30 |
| D34 | D34 | TOPIK 3-4 | 30 |
| C34 | C34 | TOPIK 3-4 | 30 |
| S34 | S34 | TOPIK 3-4 | 30 |
| Q56 | Q56 | TOPIK 5-6 | 35 |

---

## 13. Scripts & Công Cụ

| Script | Chức năng | Cách dùng |
|--------|-----------|-----------|
| `scripts/seed-demo-data.sh` | Seed dữ liệu demo | `./scripts/seed-demo-data.sh` |
| `scripts/reset-demo-db.sh` | Reset database về trạng thái demo | `./scripts/reset-demo-db.sh` |
| `scripts/verify-demo-data.sh` | Kiểm tra tính toàn vẹn dữ liệu | `./scripts/verify-demo-data.sh` |
| `scripts/test-api.sh` | Test API endpoints | `./scripts/test-api.sh` |
| `scripts/generate-seed.py` | Generate seed data script | `python3 scripts/generate-seed.py` |

---

## 14. Biến Môi Trường

### Backend

| Variable | Default | Mô tả |
|----------|---------|-------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/hoanobita` | Database URL |
| `DB_USER` | `hoanobita` | Database username |
| `DB_PASSWORD` | `hoanobita` | Database password |
| `JWT_SECRET` | (dev default) | JWT signing key (≥ 256 bits) |
| `JWT_EXPIRES_SECONDS` | `3600` | Token expiry (seconds) |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `APP_STORAGE_TYPE` | `local` | Storage type: `local` or `gcs` |
| `APP_STORAGE_GCS_BUCKET` | — | GCS bucket name |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS allowed origins |
| `APP_SEED_ENABLED` | `false` | Enable data seeder |
| `SPRING_PROFILES_ACTIVE` | — | Spring profile |

### Frontend

| Variable | Default | Mô tả |
|----------|---------|-------|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Backend API base URL |

### Docker Compose

| Variable | Default | Mô tả |
|----------|---------|-------|
| `POSTGRES_DB` | `hoanobita` | Database name |
| `POSTGRES_USER` | `hoanobita` | Database user |
| `POSTGRES_PASSWORD` | `hoanobita` | Database password |
| `JWT_SECRET` | (dev default) | JWT secret |
| `BACKEND_URL` | `http://localhost:8080` | Backend URL (nginx proxy) |

### GCP Deployment (`.env`)

| Variable | Mô tả |
|----------|-------|
| `GCP_PROJECT_ID` | GCP Project ID |
| `GCP_PROJECT_NUMBER` | GCP Project Number |
| `GCP_REGION` | GCP Region (default: asia-southeast1) |
| `DB_PASSWORD` | Cloud SQL password |
| `JWT_SECRET` | JWT secret cho production |

---

## 15. Docker & Triển Khai

### 15.1. Docker Images

| Service | Base Image | Build Stage |
|---------|-----------|-------------|
| Backend | `maven:3.9-eclipse-temurin-21` → `eclipse-temurin:21-jre-alpine` | Multi-stage |
| Frontend | `node:22-alpine` → `nginx:1.27-alpine` | Multi-stage |
| PostgreSQL | `postgres:16-alpine` | Pre-built |

### 15.2. Docker Compose — Full Stack

```bash
# Build & start all services
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop & remove volumes (reset DB)
docker compose down -v
```

Port mapping:
| Service | Host Port | Container Port |
|---------|-----------|---------------|
| Frontend | 3000 | 8080 (nginx) |
| Backend | 8080 | 8080 |
| PostgreSQL | 5432 | 5432 |

### 15.3. GCP Deployment (Terraform + Cloud Run)

```bash
# 1. Setup gcloud
./deploy.sh setup

# 2. Create Artifact Registry
./deploy.sh registry

# 3. Setup VPC + Connector
./deploy.sh network

# 4. Create Cloud SQL
./deploy.sh database

# 5. Setup Secret Manager
./deploy.sh secrets

# 6. Create GCS bucket
./deploy.sh storage

# 7. Build & Push Docker images
./deploy.sh build

# 8. Deploy to Cloud Run
./deploy.sh deploy

# 9. Check status
./deploy.sh status

# 10. Destroy all resources
./deploy.sh destroy
```

### 15.4. Terraform Modules

| Module | Resource |
|--------|----------|
| `artifact_registry` | Docker image repository |
| `networking` | VPC + Serverless VPC Connector |
| `database` | Cloud SQL PostgreSQL instance |
| `secrets` | Secret Manager (DB password, JWT secret) |
| `gcs_uploads` | GCS bucket for file uploads |
| `iam` | Service accounts + IAM bindings |
| `cloud_run` | Cloud Run services (backend, frontend) |

---

## 16. Testing

### 16.1. Backend Tests

```bash
# Run all unit tests
cd backend
./mvnw test

# Run integration tests
./mvnw verify

# Run specific test class
./mvnw test -Dtest=AssignmentControllerTest

# Run with coverage
./mvnw test jacoco:report
```

- **Framework:** JUnit 5 + Spring Boot Test + Spring Security Test
- **Test Database:** H2 in-memory (PostgreSQL mode)
- **Test files:** 12 Java files trong `src/test/`
- **Integration tests:** Pattern `**/*IT.java` (maven-failsafe-plugin)

### 16.2. Frontend

Hiện tại **chưa có test framework** được cấu hình. Khuyến nghị thêm Vitest + React Testing Library.

---

## 17. Swagger / API Docs

Khi backend đang chạy, truy cập:

| Document | URL |
|----------|-----|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

---

## 18. Xử Lý Sự Cố

### 18.1. Backend không khởi động

```bash
# Kiểm tra PostgreSQL đã chạy chưa
docker ps | grep postgres

# Kiểm tra kết nối DB
psql -h localhost -U hoanobita -d hoanobita

# Kiểm tra port 8080
lsof -i :8080
```

### 18.2. Flyway migration lỗi

```bash
# Xem migration status
./mvnw flyway:info

# Repair migration
./mvnw flyway:repair

# Nuclear option: drop & recreate DB
docker compose down -v
docker compose up -d postgres
```

### 18.3. Frontend không kết nối được Backend

```bash
# Kiểm tra CORS_ORIGINS trong application.yml
# Đảm bảo VITE_API_URL đúng
echo $VITE_API_URL

# Kiểm tra Backend đang chạy
curl http://localhost:8080/actuator/health
```

### 18.4. Docker Compose issues

```bash
# Rebuild từ đầu
docker compose down -v
docker compose build --no-cache
docker compose up

# Kiểm tra logs
docker compose logs backend
docker compose logs frontend
```

### 18.5. Port conflict

```bash
# Tìm process chiếm port
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Backend
lsof -i :5173  # Frontend dev
lsof -i :3000  # Frontend docker

# Kill process
kill -9 <PID>
```

---

## 19. Roadmap

### Đã hoàn thành ✅

- [x] CRUD toàn diện cho Users, Classes, Lessons, Materials, Assignments
- [x] Nộp bài đa tệp (max 5 files)
- [x] Chấm điểm & feedback
- [x] Điểm danh theo buổi học
- [x] Dashboard theo vai trò
- [x] Thông báo & nhắc nhở tự động
- [x] Lịch học
- [x] Báo cáo & thống kê
- [x] Nhật ký hoạt động
- [x] Export submissions as ZIP
- [x] File preview with authenticated blob URLs
- [x] Vietnamese/Korean i18n
- [x] Docker Compose full stack
- [x] Terraform GCP deployment
- [x] Rebuild UI (27 pages)

### Khuyến nghị cải thiện 🔄

| # | Ưu tiên | Nội dung |
|---|---------|----------|
| 1 | 🔴 Cao | Thêm frontend tests (Vitest + React Testing Library) |
| 2 | 🔴 Cao | Hoàn thành migration legacy → rebuild UI, xoá legacy code |
| 3 | 🟡 Trung bình | Tăng backend test coverage (hiện 12/145 source files) |
| 4 | 🟡 Trung bình | Thêm CI/CD pipeline (GitHub Actions) |
| 5 | 🟡 Trung bình | Structured logging (JSON format) |
| 6 | 🟢 Thấp | Unified error codes |
| 7 | 🟢 Thấp | WebSocket cho real-time notifications |
| 8 | 🟢 Thấp | Cloud file storage cho production |

---

> **© 2026 Hoà Nobita TOPIK Platform** — Tài liệu được tạo tự động từ phân tích dự án.
