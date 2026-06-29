#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-hoanobita-postgres}"
DB_USER="${DB_USER:-hoanobita}"
DB_NAME="${DB_NAME:-hoanobita}"

need(){ command -v "$1" >/dev/null || { echo "$1 is required" >&2; exit 1; }; }
pass(){ echo "[verify][PASS] $*"; }
fail(){ echo "[verify][FAIL] $*" >&2; exit 1; }
need docker

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  fail "Postgres container '$DB_CONTAINER' is not running"
fi

query(){ docker exec -i "$DB_CONTAINER" psql -qtA -U "$DB_USER" -d "$DB_NAME" -c "$1" | tr -d '[:space:]'; }
expect(){ local name="$1" sql="$2" expected="$3"; local got; got="$(query "$sql")"; [[ "$got" == "$expected" ]] && pass "$name = $got" || fail "$name expected $expected got $got"; }
expect_at_least(){ local name="$1" sql="$2" min="$3"; local got; got="$(query "$sql")"; [[ "$got" =~ ^[0-9]+$ && "$got" -ge "$min" ]] && pass "$name = $got (>= $min)" || fail "$name expected >= $min got $got"; }

expect "total active users" "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL" "63"
expect "teacher count" "SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='TEACHER_OWNER' AND u.deleted_at IS NULL" "1"
expect "class admin count" "SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='CLASS_ADMIN' AND u.deleted_at IS NULL" "2"
expect "student count" "SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='STUDENT' AND u.deleted_at IS NULL" "60"
expect "exact demo classes" "SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL AND code IN ('TOPIK23-FOUNDATION','TOPIK34-INTENSIVE','TOPIK56-WRITING','GIAOTIEP-A1')" "4"
expect "total active classes" "SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL" "4"
expect "Chiều members" "SELECT COUNT(*) FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE c.code='TOPIK23-FOUNDATION' AND cm.status='ACTIVE'" "15"
expect "Đêm members" "SELECT COUNT(*) FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE c.code='TOPIK34-INTENSIVE' AND cm.status='ACTIVE'" "15"
expect "Viết members" "SELECT COUNT(*) FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE c.code='TOPIK56-WRITING' AND cm.status='ACTIVE'" "15"
expect "Giao tiếp members" "SELECT COUNT(*) FROM class_members cm JOIN classes c ON c.id=cm.class_id WHERE c.code='GIAOTIEP-A1' AND cm.status='ACTIVE'" "15"
expect "Chiều admin" "SELECT COUNT(*) FROM class_admins ca JOIN classes c ON c.id=ca.class_id JOIN users u ON u.id=ca.admin_id WHERE c.code='TOPIK23-FOUNDATION' AND u.email='admin.chieu@hoanobita.com'" "1"
expect "Đêm admin" "SELECT COUNT(*) FROM class_admins ca JOIN classes c ON c.id=ca.class_id JOIN users u ON u.id=ca.admin_id WHERE c.code='TOPIK34-INTENSIVE' AND u.email='admin.dem@hoanobita.com'" "1"
expect "Viết admin" "SELECT COUNT(*) FROM class_admins ca JOIN classes c ON c.id=ca.class_id JOIN users u ON u.id=ca.admin_id WHERE c.code='TOPIK56-WRITING' AND u.email='admin.chieu@hoanobita.com'" "1"
expect "Giao tiếp admin" "SELECT COUNT(*) FROM class_admins ca JOIN classes c ON c.id=ca.class_id JOIN users u ON u.id=ca.admin_id WHERE c.code='GIAOTIEP-A1' AND u.email='admin.dem@hoanobita.com'" "1"
expect "lessons per class" "SELECT MIN(cnt) FROM (SELECT COUNT(*) cnt FROM lessons l JOIN classes c ON c.id=l.class_id WHERE l.deleted_at IS NULL GROUP BY c.code) x" "2"
expect_at_least "materials total" "SELECT COUNT(*) FROM materials WHERE deleted_at IS NULL" "4"
expect "assignments total" "SELECT COUNT(*) FROM assignments WHERE deleted_at IS NULL" "16"
expect_at_least "submissions total" "SELECT COUNT(*) FROM submissions WHERE deleted_at IS NULL" "80"
expect_at_least "grades total" "SELECT COUNT(*) FROM grades" "60"
expect_at_least "notifications total" "SELECT COUNT(*) FROM notifications" "1"
expect_at_least "activity logs total" "SELECT COUNT(*) FROM activity_logs" "4"
expect "timestamp demo users" "SELECT COUNT(*) FROM users WHERE email ~ '(kien|quan|chieu|dem)[0-9]*-[0-9]+@hoanobita\\.com'" "0"
expect "legacy starter users" "SELECT COUNT(*) FROM users WHERE email IN ('admin@hoanobita.com','student1@hoanobita.com','student2@hoanobita.com')" "0"
expect "legacy starter class" "SELECT COUNT(*) FROM classes WHERE code='TOPIK34-A'" "0"

echo "[verify] Deterministic demo data verification passed."
