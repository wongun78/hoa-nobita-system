# Hoà Nobita Korean Platform

A local MVP learning/class management system for Korean/TOPIK classes.

## Stack
- Backend: Java 21, Spring Boot 3, Spring Security, JWT, JPA/Hibernate, PostgreSQL, Flyway, OpenAPI, JUnit 5.
- Frontend: React, TypeScript, Vite, TanStack Query, React Hook Form, Axios, Tailwind-style utility CSS, React Router.
- DevOps: Docker, docker-compose, GitHub Actions.

## Requirements
- Java 21
- Node.js 22+
- Docker Desktop
- `curl`, `jq`, `rg`

## Run PostgreSQL
```bash
docker compose up -d postgres
```

## Run backend
```bash
cd backend
./mvnw spring-boot:run
```

Backend API: `http://localhost:8080/api/v1`

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

## Run frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Seed accounts
All accounts use password `Password123!`.

| Role | Email | Phone |
|---|---|---|
| TEACHER_OWNER | `teacher@hoanobita.com` | `0900000001` |
| CLASS_ADMIN | `admin@hoanobita.com` | `0900000002` |
| STUDENT | `student1@hoanobita.com` | `0900000003` |
| STUDENT | `student2@hoanobita.com` | `0900000004` |

## Run backend tests
```bash
cd backend
./mvnw -q test
```

## Build backend
```bash
cd backend
./mvnw -q compile
./mvnw -q package -DskipTests
```

## Verify frontend
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

## Run API tests
Start PostgreSQL and backend first, then:

```bash
bash scripts/test-api.sh
```

## Seed rich demo data
Start PostgreSQL and backend first, then:

```bash
bash scripts/seed-demo-data.sh
```

## Docker
```bash
docker compose up --build
```

## Dashboard API docs
- `GET /api/v1/dashboard/teacher`: Global metrics, charts, tasks, class health, risk students (TEACHER_OWNER only)
- `GET /api/v1/dashboard/admin`: Assigned-class scoped metrics (CLASS_ADMIN only)
- `GET /api/v1/dashboard/student`: Own classes, upcoming, submissions, feedback (STUDENT only)

## Troubleshooting
- If login fails, confirm backend is running and Flyway/DataInitializer completed.
- If scripts fail, install `jq` and confirm `BASE_URL` points to the backend.
- If PostgreSQL port is busy, stop the existing local PostgreSQL or adjust `docker-compose.yml`.

## Known limitations
- MVP stores JWT in localStorage; production should prefer HttpOnly Secure Cookie.
- Local file storage is implemented for development.
- Frontend is MVP-complete and API-integrated; advanced inline edit dialogs can be expanded later.
- Grading split-view UI is not yet implemented (basic grade mutation exists).
- ActivityLog entity is deferred; dashboard recent activity is derived from submissions/grades.
