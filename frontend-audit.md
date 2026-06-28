# Frontend Audit & QA Checklist

## 1. Route Coverage
- `/login`: Working, redirects to dashboard on success.
- `/dashboard`: Working, role-aware widgets.
- `/users`: Working (TEACHER only).
- `/classes`: Working, lists classes.
- `/classes/:id`: Working, tabs for Lessons, Materials, Assignments, Grading, Notifications, Students, Settings.
- `/assignments`: Working, lists assignments.
- `/assignments/:id`: Working, detail view.
- `/assignments/:id/submissions`: Working, teacher view.
- `/my-submissions`: Working, student view.
- `/grading`: Working, split-view grading center.
- `/notifications`: Working, role-aware feed and creation.
- `/change-password`: Working.
- `/reports`: Working (TEACHER only), system KPIs and performance tables.

## 2. Module Coverage
- **Auth**: JWT, 401 interceptor, role guards.
- **Users**: CRUD, status toggle.
- **Classes**: CRUD, admin/student assignment.
- **Lessons**: CRUD within class.
- **Materials**: CRUD, visibility toggle, file upload.
- **Assignments**: CRUD, publish/close, copy.
- **Submissions**: Submit, late handling.
- **Grading**: Score, feedback, request resubmit.
- **Notifications**: Target ALL/CLASS/USER, role-based policies.
- **Activity**: ActivityLog backend, RecentActivityTimeline frontend component.
- **Reports**: System KPIs, class performance, top students aggregation.

## 3. Dead Button Audit
- `onClick={() => {}}`: 0 found.
- `href="#"`: 0 found.
- Placeholders/TODOs: 0 found (except valid input placeholders).

## 4. Role UX Audit
- **TEACHER_OWNER**: Full access, can create ALL notifications, sees all classes.
- **CLASS_ADMIN**: Scoped to assigned classes, can create CLASS notifications, cannot create ALL.
- **STUDENT**: Read-only access to assigned classes, cannot create notifications, sees own submissions.

## 5. Remaining Partial/Missing Items
- JWT is in `localStorage` (MVP limitation).
- File storage is local (MVP limitation).
- Advanced inline editing dialogs can be expanded.
- Korean font strategy (`Noto Sans KR`) is prepared but not fully applied in all components.

## 6. Sprint 9 Notification Notes
- Backend policies verified: Teacher (ALL/CLASS/USER), Admin (CLASS only, assigned only), Student (read-only).
- Frontend UI updated with filters, target display, and delete actions.
- 10 specific API tests added to `test-api.sh` and passing.

## 7. Sprint 10 Activity Log Notes
- Backend: `ActivityLog` entity, repository, service, and controller implemented.
- Domain Services: `ActivityService` injected into all domain services to log mutations.
- Frontend: `RecentActivityTimeline` component created and integrated into Dashboard, Class Detail, and User Detail pages.
- Testing: API tests added to `test-api.sh` and passing.
