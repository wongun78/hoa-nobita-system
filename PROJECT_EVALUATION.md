# 🔍 ĐÁNH GIÁ TOÀN BỘ DỰ ÁN — HOA NOBITA TOPIK PLATFORM

> Ngày đánh giá: 2026-07-04  
> Scope: Full-stack (Backend + Frontend + DevOps + Security)  
> Quy mô: 139 FE files (TS/TSX) + 137 BE files (Java) + 8 Flyway migrations

---

## 1. TỔNG QUAN KIẾN TRÚC

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Java + Spring Boot | 21 + 3.3.6 |
| ORM | JPA / Hibernate | 6.5.3 |
| Database | PostgreSQL | 16.14 |
| Migration | Flyway | V1–V8 |
| Auth | JWT (jjwt) | 0.12.6 |
| Frontend | React + TypeScript | 19 + 6.0 |
| Build | Vite | 8.1 |
| State | @tanstack/react-query | 5.x |
| Routing | React Router | 7.x |
| Styling | Tailwind CSS | 4.x |
| Validation | Zod | 4.x |
| Charts | Recharts | 3.x |
| Container | Docker (Temurin + Nginx) | Multi-stage |

**Nhận xét chung**: Stack hiện đại, cập nhật, phù hợp cho production. Backend theo mô hình Controller → Service → Repository rõ ràng. Frontend sử dụng hooks + react-query đúng cách.

---

## 2. BACKEND — ĐÁNH GIÁ CHI TIẾT

### 2.1. Điểm mạnh ✅

| # | Điểm | Chi tiết |
|---|------|----------|
| 1 | **Kiến trúc phân lớp rõ ràng** | Controller → Service → Repository, mỗi module có `dto/`, `entity/`, `repository/` riêng biệt |
| 2 | **BaseEntity thống nhất** | UUID PK, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`, soft delete, `@PrePersist`/`@PreUpdate` |
| 3 | **PermissionService tập trung** | `canManageClass()`, `canAccessClass()`, `requireTeacher()`, `requireManageClass()` — tất cả quyền kiểm soát đi qua 1 service |
| 4 | **ApiResponse envelope** | `{ success, message, data, errors }` thống nhất cho mọi endpoint |
| 5 | **BusinessException với factory methods** | `badRequest()`, `notFound()`, `forbidden()`, `conflict()` — code gọn, dễ đọc |
| 6 | **GlobalExceptionHandler** | Xử lý `MethodArgumentNotValidException`, `ResponseStatusException`, `BusinessException`, `AccessDeniedException` riêng biệt |
| 7 | **Activity logging** | `ActivityService` với `REQUIRES_NEW` propagation — log không ảnh hưởng transaction chính |
| 8 | **Risk Detection** | `RiskDetectionService` đánh giá rủi ro học viên dựa trên tỷ lệ nộp bài, điểm, tần suất |
| 9 | **PaginationUtil** | Helper thống nhất cho page/size/sort/search trên in-memory lists |
| 10 | **Flyway migrations** | 8 phiên bản có thứ tự, schema versioned, rollback strategy rõ ràng |
| 11 | **API test script** | `test-api.sh` bao phủ auth, RBAC, CRUD, file upload — chạy được CI |
| 12 | **OpenAPI/Swagger** | `springdoc-openapi` tích hợp sẵn cho API documentation |

### 2.2. Vấn đề cần cải thiện ⚠️

#### 🔴 Nghiêm trọng (Nên sửa sớm)

| # | Vấn đề | Vị trí | Tác động | Đề xuất |
|---|--------|--------|----------|---------|
| B1 | **Không có unit test** | `backend/src/test/` trống | Không biết code có regress khi refactor | Viết test cho Service layer + Controller integration test |
| B2 | **Pagination in-memory** | `UserService.listUsers()`, `ClassroomService.listClasses()`, tất cả list endpoints | Load toàn bộ DB vào RAM → OOM khi data lớn | Chuyển sang `Pageable` + `Specification` hoặc `CriteriaBuilder` |
| B3 | **Dashboard load toàn bộ** | `DashboardService.getTeacherDashboard()` | Load ALL classes, assignments, submissions, grades mỗi request | Cache kết quả + tính toán async, hoặc materialized view |
| B4 | **N+1 queries tiềm ẩn** | `User.getRoles()` EAGER fetch, `ClassMemberRepository` queries lặp lại | Performance degrade theo data size | Dùng `@EntityGraph`, `JOIN FETCH`, hoặc `@BatchSize` |
| B5 | **JWT secret trong config** | `application.properties` → `app.jwt.secret` | Lộ secret khi commit code | Chuyển sang environment variable, dùng `@Value("${JWT_SECRET}")` |

#### 🟡 Trung bình (Nên sửa trong sprint tới)

| # | Vấn đề | Vị trí | Đề xuất |
|---|--------|--------|---------|
| B6 | **GlobalExceptionHandler leak nội bộ** | `handleGeneral()` → `"Internal server error: " + e.getMessage()` | Chỉ trả message chung chung, log chi tiết server-side |
| B7 | **JwtFilter swallow exception** | `catch (Exception ignored)` | Log warning để debug, không swallow hoàn toàn |
| B8 | **Enums.java là catch-all** | `common/Enums.java` chứa tất cả enums | Tách mỗi enum ra file riêng trong package tương ứng |
| B9 | **Không có rate limiting** | Auth endpoints (`/auth/login`) | Thêm `Bucket4j` hoặc Spring `HandlerInterceptor` rate limit |
| B10 | **Không có token refresh** | Chỉ có access token, không refresh token | Thêm refresh token flow để UX tốt hơn |
| B11 | **Không có caching** | Dashboard, class list, user list | Thêm `@Cacheable` với Redis hoặc Caffeine cho data ít thay đổi |
| B12 | **Thiếu database indexes** | V1 schema chỉ có PK + UNIQUE | Thêm index cho `classes.teacher_id`, `class_members.student_id`, `submissions.assignment_id`, `submissions.student_id` |
| B13 | **Password không validate complexity** | `AuthService`, `UserService.createUser()` | Thêm validation: tối thiểu 8 chars, có chữ hoa + số + ký tự đặc biệt |
| B14 | **Không có account lockout** | `/auth/login` | Lock account sau 5 lần sai password trong 15 phút |

#### 🟢 Thấp (Nice-to-have)

| # | Vấn đề | Đề xuất |
|---|--------|---------|
| B15 | Temporary password trả về trong response | Chỉ trả khi dev/test, ẩn trong production |
| B16 | Không có health check endpoint | Thêm `/actuator/health` cho monitoring |
| B17 | Không có structured logging | Chuyển sang JSON logging với Logback + SLF4J MDC |
| B18 | `@SuppressWarnings("java:S3776")` nhiều | Refactor method dài thành sub-methods |

---

## 3. FRONTEND — ĐÁNH GIÁ CHI TIẾT

### 3.1. Điểm mạnh ✅

| # | Điểm | Chi tiết |
|---|------|----------|
| 1 | **Stack hiện đại** | React 19, TypeScript 6, Vite 8, Tailwind 4 — cập nhật mới nhất |
| 2 | **Auth pattern tốt** | `AuthContext` + `useNewAuth()` + `RequireAuth`/`RequireRole` guards |
| 3 | **react-query đúng cách** | `useQuery` với `queryKey` dependency, `useMutation` với `onSuccess`/`onError`, optimistic updates |
| 4 | **Zod validation** | Create form dùng Zod schema, hiển thị field errors rõ ràng |
| 5 | **Component library tốt** | `Card`, `Button`, `Input`, `TextArea`, `FieldLabel`, `PageHeader`, `MetricCard`, `StatusBadge`, `RoleBadge`, `FilterBar`, `PaginationControls` |
| 6 | **Lazy loading + retry** | `lazyWithRetry()` cho code splitting, retry 3 lần với exponential backoff |
| 7 | **Error boundary** | `ErrorBoundary` component bắt lỗi React, hiển thị fallback UI |
| 8 | **Mobile-first** | Bottom navigation cho student, responsive grid layout |
| 9 | **Vietnamese i18n** | UI hoàn toàn tiếng Việt, status labels, error messages |
| 10 | **Vite manual chunks** | Tách vendor-react, vendor-tanstack, vendor-charts, vendor-icons |
| 11 | **ApiClientError** | Custom error class với `.fieldErrors` getter, interceptors xử lý 401/403 |
| 12 | **Page normalization** | `toBackendParams()` + `normalizeBackendPage()` xử lý 0-based ↔ 1-based page |

### 3.2. Vấn đề cần cải thiện ⚠️

#### 🔴 Nghiêm trọng

| # | Vấn đề | Vị trí | Đề xuất |
|---|--------|--------|---------|
| F1 | **Không có unit/component test** | Không có file test nào | Viết test cho hooks (`useNewAuth`), utils (`asPage`, `fmtDate`), và critical flows |
| F2 | **Page files quá lớn** | `classes-page.tsx` ~300 dòng, `class-detail-v2.tsx` ~500 dòng, `assignments-v2.tsx` ~600 dòng | Tách modal ra component riêng, tách card view vs table view |
| F3 | **Duplicated edit modal state** | `editOpen`, `editName`, `editCode`, `editDesc`, `editStatus`, `editErrors` lặp lại ở classes-page + class-detail | Tạo `useEditModal()` custom hook hoặc `EditClassModal` component |
| F4 | **Route duplication** | `/teacher/classes`, `/admin/classes`, `/vietnamese/*` đều map cùng component | Dùng nested routes với role-based layout, chỉ define 1 lần |
| F5 | **Toast pattern lặp lại** | Mỗi page tự tạo `useState + useEffect setTimeout 3s` | Tạo `useToast()` hook hoặc `ToastProvider` context |

#### 🟡 Trung bình

| # | Vấn đề | Vị trí | Đề xuất |
|---|--------|--------|---------|
| F6 | **Card không forward onClick** | `layout/ui.tsx` — `Card` chỉ nhận `children, className` | Thêm `onClick` prop hoặc dùng `forwardRef` |
| F7 | **Edit form dùng useState thuần** | Mỗi field 1 `useState` → nhiều state variables | Dùng `react-hook-form` (đã cài) cho edit forms |
| F8 | **No loading skeleton cho mutations** | `isPending` nhưng không có skeleton/spinner rõ ràng | Thêm `Spinner` component, disable form khi loading |
| F9 | **phase2-utils.tsx là catch-all** | Chứa `asPage`, `fmtDate`, `ChartCard`, `CustomTooltip`, helpers | Tách thành `utils/format.ts`, `components/charts.tsx` |
| F10 | **Dùng `globalThis.window`** | `http.ts`, `auth-provider.tsx` | Dùng `typeof window !== 'undefined'` hoặc Vite's `import.meta.env.SSR` |
| F11 | **No environment configs** | Chỉ có `VITE_API_URL` | Thêm `.env.development`, `.env.production` với configs khác nhau |
| F12 | **Inline styles phức tạp** | Tailwind classes dài 200+ ký tự trên 1 element | Tách thành reusable components hoặc `@apply` trong CSS |

#### 🟢 Thấp

| # | Vấn đề | Đề xuất |
|---|--------|---------|
| F13 | Không có Storybook | Thêm Storybook cho component documentation |
| F14 | Không có PWA config | Thêm service worker cho offline support |
| F15 | Không có accessibility audit | Kiểm tra ARIA labels, keyboard navigation |
| F16 | `eslint-disable` trong phase2-utils | Fix lint rules thay vì disable |

---

## 4. SECURITY — ĐÁNH GIÁ

### 4.1. Hiện trạng

| Area | Status | Chi tiết |
|------|--------|----------|
| Authentication | ✅ Tốt | JWT + BCrypt + Stateless session |
| Authorization | ✅ Tốt | RBAC 3 roles, PermissionService centralized |
| CORS | ⚠️ | Configurable nhưng cần restrict trong production |
| CSRF | ✅ OK | Disabled (acceptable cho JWT-based API) |
| Input Validation | ⚠️ | Bean validation có nhưng không consistent |
| SQL Injection | ✅ An toàn | JPA/Hibernate parameterized queries |
| XSS | ✅ Khá | React auto-escape, nhưng cần CSP headers |
| File Upload | ⚠️ | Có size limit nhưng cần validate file type |
| Password | ⚠️ | Không có complexity rules, không có lockout |
| Secrets | 🔴 | JWT secret trong config file |
| Rate Limiting | 🔴 | Không có |
| Logging | ⚠️ | Không log security events (login fail, access denied) |

### 4.2. Khuyến nghị Security

1. **JWT secret** → Environment variable, rotate定期
2. **Rate limiting** → 5 login attempts / 15 phút / IP
3. **Account lockout** → 5 failed logins → lock 30 phút
4. **Password policy** → Min 8 chars, 1 uppercase, 1 number, 1 special
5. **CSP headers** → `Content-Security-Policy` header trong SecurityConfig
6. **Audit logging** → Log mọi authentication events
7. **File upload validation** → Whitelist allowed MIME types
8. **HTTPS enforcement** → `Strict-Transport-Security` header

---

## 5. DEVOPS — ĐÁNH GIÁ

### 5.1. Hiện trạng

| Area | Status | Chi tiết |
|------|--------|----------|
| Docker | ⚠️ | Có Dockerfile nhưng thiếu nginx.conf cho SPA |
| Docker Compose | ⚠️ | Chỉ có PostgreSQL, thiếu full stack |
| CI/CD | 🔴 | Không có GitHub Actions / GitLab CI |
| Health Check | 🔴 | Không có `/actuator/health` |
| Monitoring | 🔴 | Không có metrics / alerting |
| Staging | 🔴 | Không có environment config cho staging |
| Logging | ⚠️ | Default Spring Boot logging, không structured |
| Backup | 🔴 | Không có DB backup strategy |

### 5.2. Khuyến nghị DevOps

```yaml
# Đề xuất: docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: hoanobita
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      
  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/hoanobita
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
        
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 6. PERFORMANCE — ĐÁNH GIÁ

### 6.1. Bottlenecks hiện tại

| # | Bottleneck | Vị trí | Impact | Fix |
|---|-----------|--------|--------|-----|
| P1 | In-memory pagination | Tất cả list endpoints | O(n) RAM, slow với >10K records | Database-level pagination |
| P2 | Dashboard full scan | `DashboardService` | 2-5s response time | Cache + materialized view |
| P3 | EAGER fetch roles | `User.roles` EAGER | N+1 trên user list | `@BatchSize(size=20)` hoặc `@EntityGraph` |
| P4 | No connection pool config | `application.properties` | Default HikariCP settings | Tune `maximumPoolSize`, `connectionTimeout` |
| P5 | No frontend prefetch | Routes | Blank screen khi navigate | Prefetch on hover với react-query |

### 6.2. Benchmarks ước tính

| Scenario | Current | Target |
|----------|---------|--------|
| `GET /classes` (100 records) | ~50ms | ~20ms |
| `GET /dashboard/teacher` | ~500ms-2s | ~100ms (cached) |
| `GET /users?size=100` | ~100ms | ~30ms |
| Frontend First Contentful Paint | ~1.5s | ~0.8s |

---

## 7. CODE QUALITY — ĐÁNH GIÁ

### 7.1. Metrics

| Metric | Value | Rating |
|--------|-------|--------|
| Backend files | 137 Java files | ⚠️ Approaching large |
| Frontend files | 139 TS/TSX files | ⚠️ Approaching large |
| Largest BE file | `DashboardService.java` ~400 lines | ⚠️ Too large |
| Largest FE file | `assignments-v2.tsx` ~600 lines | 🔴 Too large |
| Test coverage | 0% (no unit tests) | 🔴 Critical |
| API test coverage | ~60% (test-api.sh) | ⚠️ Partial |
| Code duplication | Edit modals, toast pattern, filter bar | ⚠️ Medium |
| TypeScript strictness | `strict: true` in tsconfig | ✅ Good |
| Linting | oxlint configured | ✅ Good |

### 7.2. Technical Debt Inventory

| # | Debt | Severity | Effort | Priority |
|---|------|----------|--------|----------|
| TD1 | No unit tests | 🔴 High | High (2-3 weeks) | P1 |
| TD2 | In-memory pagination | 🔴 High | Medium (3-5 days) | P1 |
| TD3 | Dashboard caching | 🟡 Medium | Medium (2-3 days) | P2 |
| TD4 | Route duplication | 🟡 Medium | Medium (2-3 days) | P2 |
| TD5 | Edit modal extraction | 🟢 Low | Low (1 day) | P3 |
| TD6 | Toast system | 🟢 Low | Low (0.5 day) | P3 |
| TD7 | Enums.java refactor | 🟢 Low | Low (0.5 day) | P3 |
| TD8 | phase2-utils split | 🟢 Low | Low (0.5 day) | P3 |

---

## 8. ROADMAP ĐỀ XUẤT

### Phase A: Stabilization (1-2 tuần)
- [ ] Viết unit tests cho Service layer (UserService, ClassroomService, AuthService)
- [ ] Viết integration tests cho Controller layer
- [ ] Frontend: test cho hooks và utils
- [ ] Fix JWT secret → environment variable
- [ ] Thêm database indexes cho foreign keys

### Phase B: Performance (1 tuần)
- [ ] Chuyển sang database-level pagination (`Pageable` + `Specification`)
- [ ] Thêm `@Cacheable` cho Dashboard
- [ ] Tune HikariCP connection pool
- [ ] Thêm `@BatchSize` cho `User.roles`

### Phase C: Code Quality (1 tuần)
- [ ] Extract `EditClassModal` component
- [ ] Tạo `useToast()` hook
- [ ] Refactor routes: nested routes with role layout
- [ ] Tách `DashboardService` thành sub-services
- [ ] Tách `phase2-utils.tsx`

### Phase D: DevOps (1 tuần)
- [ ] Thêm GitHub Actions CI/CD pipeline
- [ ] Docker Compose full stack với nginx
- [ ] Thêm `/actuator/health` endpoint
- [ ] Structured logging (JSON format)
- [ ] Environment configs (dev/staging/prod)

### Phase E: Security Hardening (3-5 ngày)
- [ ] Rate limiting trên auth endpoints
- [ ] Account lockout policy
- [ ] Password complexity validation
- [ ] CSP headers
- [ ] Security audit logging

---

## 9. TỔNG KẾT

### Điểm số tổng thể

| Category | Score | Rating |
|----------|-------|--------|
| Architecture | 8/10 | ✅ Rất tốt |
| Code Quality | 6/10 | ⚠️ Khá |
| Security | 5/10 | ⚠️ Trung bình |
| Performance | 4/10 | 🔴 Cần cải thiện |
| Testing | 1/10 | 🔴 Critical |
| DevOps | 2/10 | 🔴 Cần cải thiện |
| Documentation | 3/10 | ⚠️ Thiếu |
| **Overall** | **4.1/10** | **⚠️ Cần action** |

### Đánh giá tổng quan

**Ưu điểm chính:**
- Stack công nghệ hiện đại, cập nhật nhất (React 19, Java 21, Spring Boot 3.3)
- Kiến trúc phân lớp rõ ràng, dễ mở rộng
- RBAC implementation tốt với PermissionService centralized
- UI/UX đẹp, responsive, Vietnamese i18n đầy đủ
- API envelope pattern thống nhất

**Rủi ro chính:**
- **Zero test coverage** — rủi ro regress cao khi refactor
- **In-memory pagination** — sẽ sập khi data > 10K records
- **No caching** — Dashboard chậm, server load cao
- **No CI/CD** — deployment thủ công, dễ lỗi
- **Security gaps** — JWT secret lộ, không rate limiting, không lockout

**Khuyến nghị:** Ưu tiên **Phase A (Testing)** và **Phase B (Performance)** trước khi thêm feature mới. Dự án đang ở giai đoạn "works but not production-ready".

---

## 10. FILE STRUCTURE ĐỀ XUẤT

```
backend/src/main/java/com/hoanobita/topikplatform/
├── common/
│   ├── BaseEntity.java
│   ├── ApiResponse.java
│   ├── BusinessException.java
│   ├── GlobalExceptionHandler.java
│   ├── PaginationUtil.java
│   ├── SecurityUtils.java
│   └── PermissionService.java
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── JwtFilter.java
│   ├── JwtService.java
│   └── SecurityConfig.java
├── user/
│   ├── UserController.java
│   ├── MeController.java
│   ├── UserService.java
│   ├── dto/
│   ├── entity/
│   │   ├── User.java
│   │   └── Role.java
│   └── repository/
├── classroom/
│   ├── ClassroomController.java
│   ├── ClassroomService.java
│   ├── dto/
│   ├── entity/
│   │   ├── Klass.java
│   │   ├── ClassAdmin.java
│   │   └── ClassMember.java
│   └── repository/
├── assignment/
├── submission/
├── grading/
├── lesson/
├── material/
├── notification/
├── attendance/
├── file/
├── activity/
├── dashboard/
├── calendar/
├── risk/
└── service/  ← (empty, consider removing or using for cross-cutting)

frontend/src/rebuild/
├── auth/
│   ├── auth-context.ts
│   ├── auth-provider.tsx
│   ├── guards.tsx
│   ├── role-redirect.ts
│   └── use-auth.ts
├── core/
│   ├── api.ts
│   ├── http.ts
│   ├── token.ts
│   └── types.ts
├── layout/
│   ├── app-shell.tsx
│   └── ui.tsx
├── components/
│   ├── error-boundary.tsx
│   ├── foundation.tsx
│   └── student-file-upload.tsx
├── pages/
│   ├── classes-page.tsx
│   ├── class-detail-v2.tsx
│   ├── assignments-v2.tsx
│   ├── grading-v2.tsx
│   ├── ... (27 page files)
│   └── phase2-utils.tsx
└── router.tsx
```

---

*Đánh giá này dựa trên codebase snapshot tại commit `ab7c97e` (2026-07-04).*
