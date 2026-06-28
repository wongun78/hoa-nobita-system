# Frontend Audit

## 1. Navigation bugs found
- Refactored the compact all-in-one screen into providers, router, layout, system components, pages, and i18n modules.
- Preserved role-based sidebar and fixed active-state logic so `/assignments` no longer activates `/classes`.
- Removed brittle `location.pathname.split(...)` route derivation from the new routed pages; nested pages use route params.

## 2. Route mapping table
| Route | Page | Roles | API integration |
|---|---|---|---|
| `/login` | Đăng nhập | Public | `POST /auth/login` |
| `/dashboard` | Tổng quan | All authenticated | summary cards |
| `/classes` | Lớp học | All authenticated | `GET /classes` |
| `/classes/:classId` | Chi tiết lớp học | Scoped access | links to scoped children |
| `/classes/:classId/materials` | Tài liệu | Scoped access | `GET /classes/{id}/materials` |
| `/classes/:classId/assignments` | Bài tập theo lớp | Scoped access | `GET /classes/{id}/assignments` |
| `/assignments` | Bài tập | All authenticated | `GET /assignments` |
| `/assignments/:assignmentId` | Chi tiết bài tập | Scoped access | `GET /assignments/{id}`, submit form |
| `/assignments/:assignmentId/submissions` | Bài nộp | Teacher/Admin | `GET /assignments/{id}/submissions` |
| `/me/submissions` | Bài nộp của tôi | Student | `GET /me/submissions` |
| `/users` | Người dùng | Teacher owner | `GET /users` |
| `/notifications` | Thông báo | All authenticated | `GET /notifications` |
| `/change-password` | Đổi mật khẩu | Authenticated | placeholder ready for API |
| `/forbidden` | Không có quyền | Public | static |

## 3. Vietnamese text issues
- Visible Vietnamese copy uses accents: `Đăng nhập`, `Lớp học`, `Bài tập`, `Tài liệu`, `Thông báo`, `Nộp bài`, `Không có quyền truy cập`.
- Verified with grep for common unaccented strings; no matches found in `frontend/src`.

## 4. Clutter/excessive copy
- Dashboard copy is concise and task-oriented.
- Removed starter/demo visual clutter and kept a calm white/blue enterprise layout.

## 5. Loading/empty/error states
- Shared system states exist for loading, empty, and error cases.
- List-driven pages show status feedback for API latency and failures.

## 6. API integration issues
- Axios client remains centralized in `frontend/src/lib/api.ts` with Bearer token injection.
- TanStack Query is used for page data fetching.
- React Hook Form + Zod validation is used for the login form.

## 7. Role-based UX issues
- `STUDENT` sees `Bài nộp của tôi` and does not see user administration.
- `TEACHER_OWNER` sees user administration and grading-oriented routes.
- `CLASS_ADMIN` gets management wording for class navigation and can access assignment submissions.

## 8. Design system issues
- Added reusable UI/system primitives for buttons, inputs, text areas, cards, page headers, status badges, role badges, loading/empty/error states, and stat cards.
- Added an app shell with a consistent sidebar/topbar and language toggle.

## 9. Demo data gaps
- Demo seed script now creates 12 demo students, 4 classes, admins, memberships, lessons, materials, DRAFT/PUBLISHED/CLOSED assignments, notifications, submissions, grades, late submissions, and resubmission requests.

## 10. Dashboard analytics issues
- Dashboard API responses were missing some nested fields expected by the frontend and test scripts.
- Fixed backend `DashboardService` to return the exact structure required by the frontend and test scripts (e.g., `kpi.classes.total`, `activeClassCount`).
- Fixed `test-api.sh` to assert the correct JSON paths.

## 13. Class Detail Students & Settings (Sprint 2)
- Implemented the Students tab in `ClassDetailPage`.
  - Lists students with full name, email, and join date.
  - Allows adding students (selecting from available users with STUDENT role).
  - Allows removing students with confirmation.
  - Allows updating student status (ACTIVE, PAUSED, REMOVED).
- Implemented the Settings tab in `ClassDetailPage`.
  - Includes a form to edit class details (name, code, description, levels, dates, status).
  - Includes an Admin management section to assign and remove CLASS_ADMIN users.
  - Includes a Danger Zone to delete the class (with confirmation).
- Updated header actions to use the new tabs and dialogs.
- Ensured role-based access control (TEACHER_OWNER and CLASS_ADMIN can manage, STUDENT can only view).
- Updated `features/classes/types.ts`, `api.ts`, and `hooks.ts` to support the new endpoints.
- Added maintainable frontend structure under `src/app`, `src/components`, `src/features`, `src/i18n`, and `src/pages`.
- Replaced `App.tsx` with a small provider/router entrypoint.
- Split the former aggregate `pages/core.tsx` into focused page modules: `login-page.tsx`, `list-pages.tsx`, `detail-pages.tsx`, `status-pages.tsx`, `route-guards.tsx`, and `shared.tsx`.
- Moved auth and i18n contexts/hooks into dedicated files to keep provider files component-only and lint clean.
- Removed legacy compact App code, dead imports/components, `@ts-nocheck`, and hard-coded login password defaults from `frontend/src`.
- Verified `frontend/src` diagnostics report no errors.
- Verified `npm run typecheck`, `npm run lint`, and `npm run build` pass; Tailwind/Lightning CSS warnings remain non-blocking build warnings.
- Fixed backend JPQL queries in `GradeRepository` and `NotificationRepository` to resolve startup errors.
- Fixed `test-api.sh` dashboard assertions to match the actual API response structure.
