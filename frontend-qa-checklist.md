# Frontend QA Checklist

## Build and static verification
| Check | Result | Evidence |
|---|---|---|
| VS Code diagnostics | Pass | `frontend/src` reports no errors after the 39-problem cleanup pass |
| TypeScript typecheck | Pass | `npm run typecheck` exited `0` |
| Static lint | Pass | `npm run lint` exited `0` |
| TypeScript/Vite production build | Pass | `npm run build` exited `0` |
| Vietnamese accent scan | Pass | grep found no common unaccented Vietnamese UI strings |
| Route-param safety | Pass | Routed pages use `useParams`; no pathname-split routing remains |
| Role guard coverage | Pass | Protected routes define teacher/admin/student route access |
| Dead code cleanup | Pass | No `@ts-nocheck`, legacy App snapshot, `pages/core` import, or old hard-coded login password remains in `frontend/src` |

## Role-by-role verification matrix
| Role | Route | Expected page | Verification result | Notes |
|---|---|---|---|---|
| TEACHER_OWNER | `/dashboard` | Teacher dashboard | Pass | Blue/white app shell |
| TEACHER_OWNER | `/classes` | All classes | Pass | API scoped by backend |
| TEACHER_OWNER | `/classes/:classId` | Class Detail | Pass | Students, Settings, Admins tabs implemented |
| CLASS_ADMIN | `/classes/:classId` | Class Detail | Pass | Students, Settings tabs implemented |
| STUDENT | `/classes/:classId` | Class Detail | Pass | Read-only view |
| TEACHER_OWNER | `/classes/:classId/materials` | Class materials | Pass | Uses scoped class id |
| TEACHER_OWNER | `/classes/:classId/assignments` | Class assignments | Pass | Uses scoped class id |
| TEACHER_OWNER | `/assignments` | Global assignments | Pass | Not routed to classes |
| TEACHER_OWNER | `/assignments/:assignmentId/submissions` | Submission list | Pass | Teacher/admin route |
| TEACHER_OWNER | `/users` | Users | Pass | Teacher-only nav |
| TEACHER_OWNER | `/grading` | Grading Center | Pass | Split-view UI, API integrated |
| CLASS_ADMIN | `/grading` | Grading Center | Pass | Allowed by guard |
| STUDENT | `/grading` | Forbidden | Pass | Guarded route |
| TEACHER_OWNER | `/notifications` | Notifications | Pass | API integrated |
| CLASS_ADMIN | `/dashboard` | Admin dashboard | Pass | Scoped nav wording |
| CLASS_ADMIN | `/classes` | Assigned classes | Pass | Backend enforces scope |
| CLASS_ADMIN | `/assignments` | Assigned assignments | Pass | Backend enforces scope |
| CLASS_ADMIN | `/assignments/:assignmentId/submissions` | Submission list | Pass | Allowed by guard |
| CLASS_ADMIN | `/users` | Forbidden/no nav | Pass | Hidden in sidebar and guarded |
| STUDENT | `/dashboard` | Student dashboard | Pass | Student nav |
| STUDENT | `/classes` | My classes | Pass | Backend membership scope |
| STUDENT | `/assignments` | Visible assignments | Pass | Draft hidden by backend |
| STUDENT | `/assignments/:assignmentId` | Submit assignment | Pass | Submission form available |
| STUDENT | `/me/submissions` | My submissions | Pass | Student-only route |
| STUDENT | `/users` | Forbidden | Pass | Guarded route |
| STUDENT | `/notifications` | Relevant notifications | Pass | Backend scoped |
| CLASS_ADMIN | `/users/:userId` | User Detail | Pass | Can only view progress of students in assigned classes |

## Dashboard Analytics Verification
| Check | Result | Evidence |
|---|---|---|
| Teacher Dashboard API | Pass | `GET /dashboard/teacher` returns global metrics, charts, tasks, class health, risk students |
| Admin Dashboard API | Pass | `GET /dashboard/admin` returns assigned-class scoped metrics |
| Student Dashboard API | Pass | `GET /dashboard/student` returns own classes, upcoming, submissions, feedback |

## Sprint 5: Files Module Verification
| Check | Result | Evidence |
|---|---|---|
| Files API | Pass | `uploadFile` and `downloadFile` implemented and working. |
| FileUploadField | Pass | Reusable component handles file selection, validation, and upload. |
| Materials Integration | Pass | Create/Edit Material supports both External URL and File Upload. |
| Material Download | Pass | Download button works for materials with `fileId`. |
| Grading Integration | Pass | Download button works for submissions with `fileId`. |
| Dead Buttons | Pass | Removed deferred file notes. No dead buttons found. |
| Build & Tests | Pass | Frontend typecheck/lint/build pass. |
| Dashboard API Tests | Pass | `test-api.sh` asserts dashboard structure and role scoping |
