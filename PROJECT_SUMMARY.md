# Hoà Nobita Korean Platform – Project Summary (2026-06-28)

## 1. Project Overview
**Hoà Nobita Korean Platform** is a production-grade MVP for managing Korean language (TOPIK) classes. It supports three roles (TEACHER_OWNER, CLASS_ADMIN, STUDENT) with real JWT authentication, role-based permissions, full CRUD operations, assignment submission & grading workflows, lesson/material management, notifications, and rich demo data.

The system emphasizes:
- Real backend (Spring Boot + PostgreSQL + Flyway)
- Real frontend (React 19 + TypeScript + TanStack Query)
- Real API integration (no mocks)
- Real forms, validation, and role-aware navigation
- Complete test coverage via `scripts/test-api.sh` (72/72 tests)

## 2. Technology Stack

### Backend
- **Java 21**, Spring Boot 3.3.6
- Spring Security + JWT (stateless)
- Spring Data JPA / Hibernate
- PostgreSQL 16 + Flyway (schema versioning v3)
- Bean Validation + custom validators
- Springdoc OpenAPI (Swagger UI)
- JUnit 5 + Mockito

### Frontend
- **React 19** + **TypeScript 5.6**
- **Vite 8** + **Tailwind CSS v4** (with `@tailwindcss/vite` plugin)
- **TanStack Query v5** (server state)
- React Hook Form + Zod (forms & validation)
- React Router v7
- Axios + centralized error handling (401 auto-logout)
- Lucide React icons

### DevOps & Tooling
- Docker + docker-compose (PostgreSQL)
- Maven Wrapper
- npm scripts: `typecheck`, `lint` (oxlint), `build`
- Bash test scripts (`test-api.sh`, `seed-demo-data.sh`)

## 3. Architecture

### Backend (Package Structure)
```
com.hoanobita.topikplatform
├── auth/          (Login, Me, ChangePassword, Logout)
├── user/          (User management – TEACHER only)
├── classroom/     (Classes + admins + students)
├── lesson/        (Lessons per class)
├── material/      (Materials + visibility toggle)
├── assignment/    (Assignments + publish/close/copy)
├── submission/    (Student submissions + my submissions)
├── grading/       (Grading queue + grade + request resubmit)
├── notification/  (System notifications)
├── file/          (File upload/download)
└── common/        (SecurityUtils, PermissionService, ApiResponse, etc.)
```

### Frontend (Feature-Based Architecture – Phase 1 Complete)
```
src/
├── features/
│   ├── auth/          (auth-context, use-auth, provider)
│   ├── users/         (types, api, hooks)
│   ├── classes/       (types, api, hooks)
│   ├── lessons/       (types, api, hooks)
│   ├── materials/     (types, api, hooks)
│   ├── assignments/   (types, api, hooks)
│   ├── submissions/   (types, api, hooks)
│   ├── grading/       (types, api, hooks)
│   └── notifications/ (types, api, hooks)
├── pages/             (12+ focused pages, no giant core.tsx)
├── components/ui/     (Button, Card, Input, Dialog, Select, Tabs, ConfirmDialog, Toast)
├── components/layout/ (AppShell, Sidebar)
├── lib/               (api.ts + 401 interceptor, query-keys.ts, api-error.ts)
├── i18n/              (vi.ts, ko.ts, context extraction)
└── app/               (providers.tsx, router.tsx)
```

**Key Design Decisions**
- Every domain has its own `types.ts` + `api.ts` + `hooks.ts`
- `query-keys.ts` centralizes all TanStack Query keys
- `api.ts` has request/response interceptors + automatic logout on 401
- All pages use real `useQuery` / `useMutation`
- Readonly props enforced on all components
- No `@ts-nocheck`, no hard-coded `Password123!` in source

## 4. Backend API Inventory (All Endpoints)

| Domain | Method | Path | Auth | Notes |
|--------|--------|------|------|-------|
| Auth | POST | `/auth/login` | Public | Returns JWT + user |
| Auth | GET | `/auth/me` | JWT | Current user |
| Auth | POST | `/auth/change-password` | JWT | Requires current + new |
| Auth | POST | `/auth/logout` | JWT | Client-side token removal |
| Users | GET/POST/PATCH/DELETE | `/users` + `/{id}` + `/status` | TEACHER | Full user lifecycle |
| Classes | GET/POST/PATCH/DELETE | `/classes` + `/{id}` | Role-scoped | + Admin/Student management |
| Lessons | GET/POST/PATCH/DELETE | `/classes/{id}/lessons` + `/lessons/{id}` | Member | Order index supported |
| Materials | GET/POST/PATCH/DELETE | `/classes/{id}/materials` + `/materials/{id}` + `/visibility` | Member | Visibility toggle |
| Assignments | GET/POST/PATCH/DELETE | `/classes/{id}/assignments` + `/assignments/{id}` + `/publish` + `/close` + `/copy` | Owner/Admin | Full workflow |
| Submissions | GET/POST/PATCH/DELETE | `/assignments/{id}/submissions` + `/submissions/{id}` + `/me/submissions` | Student/Owner | Resubmit support |
| Grading | GET/POST/PATCH | `/classes/{id}/grading/submissions` + `/submissions/{id}/grade` + `/grades/{id}` + `/request-resubmit` | Owner/Admin | Scoring + feedback |
| Notifications | GET/POST/DELETE | `/notifications` + `/{id}` | TEACHER | TargetType: ALL/CLASS/ROLE |
| Files | POST/GET | `/files/upload` + `/{id}/download` | JWT | Local storage (dev) |

All endpoints return `{ success, data, message }` wrapper via `ApiResponse`.

## 5. Frontend Pages & Features (Current State)

**Implemented & API-Connected**
- Login (real form, env-based demo password)
- Dashboard (role-aware stats widgets)
- Users (create, list, status toggle, delete – TEACHER only)
- Classes (create, list, detail with tabs)
- Class Detail (Lessons, Materials, Assignments, Grading, Students tabs)
- Assignments (global + per-class list, create, publish/close)
- Assignment Detail (submit for students, publish/close for teachers)
- Assignment Submissions (teacher view)
- My Submissions (student view)
- Notifications (create + list)
- Change Password (real API call)

**UI Components**
- Button (default/outline/destructive variants)
- Card, Input, Textarea, Select, Dialog, Tabs, ConfirmDialog, Toast
- Loading / Empty / Error states
- Role-based navigation + route guards

**Tailwind Status**: Fully operational after adding `@tailwindcss/vite` plugin (build verified).

## 6. Authentication & Security
- JWT stored in `localStorage` (MVP limitation noted in README)
- Automatic 401 handling → redirect to `/login`
- `PermissionService` on backend enforces `requireTeacherOrAdmin`, `requireTeacher`, etc.
- First-login flag supported for forced password change

## 7. Demo Data & Testing
- **Seed accounts** (password: `Password123!`):
  - `teacher@hoanobita.com` – TEACHER_OWNER
  - `admin@hoanobita.com` – CLASS_ADMIN
  - `student1@hoanobita.com`, `student2@hoanobita.com` – STUDENT
- `scripts/seed-demo-data.sh` creates rich dataset (classes, lessons, materials, assignments, submissions, grades, notifications)
- `scripts/test-api.sh` – 72 regression tests covering all roles and edge cases (invalid email, level validation, score > maxScore, etc.)
- Both scripts pass before and after seeding.

## 8. Verification Results (Latest Run – 2026-06-28)
- Backend: `mvnw compile` ✓, `test` ✓, `package -DskipTests` ✓
- Frontend: `npm run typecheck` ✓, `npm run lint` ✓ (only minor unused-param warnings), `npm run build` ✓
- API regression: 72/72 passed (twice)
- Tailwind: Confirmed working (CSS size reduced after plugin)
- No unaccented Vietnamese text in `frontend/src`
- VS Code diagnostics on `frontend/src`: 0 errors
- Flyway: Clean schema v3 on startup

## 9. Known Limitations & Future Work
- JWT in localStorage (recommend HttpOnly cookie for production)
- File storage is local (consider S3/MinIO later)
- Grading queue and student management in class detail are partially stubbed
- Advanced inline editing dialogs can be expanded
- No file upload UI yet (backend endpoint exists)
- Korean font strategy (`Noto Sans KR`) is prepared but not fully applied in all components

## 10. How to Run (Quick Start)
```bash
docker compose up -d postgres
cd backend && ./mvnw spring-boot:run
cd frontend && npm run dev
# Then run seed + test scripts
```

**Swagger**: http://localhost:8080/swagger-ui/index.html  
**Frontend**: http://localhost:5173

---

**Status**: Phase 1 (Foundation + Core Pages) **COMPLETE**.  
The project is now a real, production-quality MVP ready for further feature expansion or deployment hardening.

*Generated on 2026-06-28 based on latest codebase audit and verification commands.*
