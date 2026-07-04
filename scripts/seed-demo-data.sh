#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-hoanobita-postgres}"
DB_USER="${DB_USER:-hoanobita}"
DB_NAME="${DB_NAME:-hoanobita}"

need(){ command -v "$1" >/dev/null || { echo "$1 is required"; exit 1; }; }
log(){ echo "[seed] $*"; }
need docker

log "Seeding deterministic Hoà Nobita demo data"
log "This script is reset-safe and replaces all non-teacher demo/test data."

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "Postgres container '$DB_CONTAINER' is not running. Start it first." >&2
  exit 1
fi

cat <<'SQL' | docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"
BEGIN;

-- Clean everything except mandatory roles and the stable teacher account.
TRUNCATE TABLE activity_logs, grades, submissions, assignments, materials, lessons, class_members, class_admins, classes, notifications, files RESTART IDENTITY CASCADE;
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email <> 'hoateacher@hoanobita.com');
DELETE FROM users WHERE email <> 'hoateacher@hoanobita.com';

-- Ensure roles exist and teacher has the canonical profile/password created by DataInitializer.
INSERT INTO roles (name) VALUES ('TEACHER_OWNER'), ('CLASS_ADMIN'), ('STUDENT') ON CONFLICT (name) DO NOTHING;
UPDATE users SET full_name = 'Nguyễn Tuấn Hoà', phone = '0900000001', status = 'ACTIVE', first_login = false, deleted_at = NULL WHERE email = 'hoateacher@hoanobita.com';
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'hoateacher@hoanobita.com' AND r.name = 'TEACHER_OWNER'
ON CONFLICT DO NOTHING;

-- Stable admins and 60 stable students. All use the same bcrypt hash as teacher => Password123!.
WITH teacher_hash AS (SELECT password_hash FROM users WHERE email = 'hoateacher@hoanobita.com'),
admin_rows(full_name,email,phone) AS (
  VALUES ('Admin Kiên','admin.chieu@hoanobita.com','0901000001'), ('Admin Quân','admin.dem@hoanobita.com','0901000002')
),
student_rows AS (
  SELECT 'Học viên Chiều ' || lpad(i::text,2,'0') AS full_name, 'student.chieu' || i || '@hoanobita.com' AS email, '0911' || lpad(i::text,6,'0') AS phone FROM generate_series(1,15) i
  UNION ALL
  SELECT 'Học viên Đêm ' || lpad(i::text,2,'0') AS full_name, 'student.dem' || i || '@hoanobita.com' AS email, '0912' || lpad(i::text,6,'0') AS phone FROM generate_series(1,15) i
  UNION ALL
  SELECT 'Học viên Viết ' || lpad(i::text,2,'0') AS full_name, 'student.viet' || i || '@hoanobita.com' AS email, '0913' || lpad(i::text,6,'0') AS phone FROM generate_series(1,15) i
  UNION ALL
  SELECT 'Học viên Giao tiếp ' || lpad(i::text,2,'0') AS full_name, 'student.giaotiep' || i || '@hoanobita.com' AS email, '0914' || lpad(i::text,6,'0') AS phone FROM generate_series(1,15) i
),
all_rows AS (
  SELECT *, 'CLASS_ADMIN' AS role_name FROM admin_rows
  UNION ALL
  SELECT *, 'STUDENT' AS role_name FROM student_rows
),
inserted AS (
  INSERT INTO users(full_name,email,phone,password_hash,status,first_login,created_at,updated_at)
  SELECT a.full_name, a.email, a.phone, h.password_hash, 'ACTIVE', false, NOW(), NOW()
  FROM all_rows a CROSS JOIN teacher_hash h
  RETURNING id,email
)
INSERT INTO user_roles(user_id, role_id)
SELECT i.id, r.id FROM inserted i JOIN all_rows a ON a.email = i.email JOIN roles r ON r.name = a.role_name;

-- Four exact classes.
WITH teacher AS (SELECT id FROM users WHERE email = 'hoateacher@hoanobita.com'),
klass_rows(name,code,description,level_from,level_to,start_date,end_date) AS (
  VALUES
    ('TOPIK 2-3 Foundation','TOPIK23-FOUNDATION','Lớp TOPIK 2-3 nền tảng: củng cố ngữ pháp và từ vựng cơ bản.', 2, 3, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'),
    ('TOPIK 3-4 Intensive','TOPIK34-INTENSIVE','Lớp TOPIK 3-4 chuyên sâu: luyện nghe, đọc, từ vựng và viết câu 53.', 3, 4, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'),
    ('TOPIK 5-6 Writing Clinic','TOPIK56-WRITING','Lớp TOPIK 5-6 chuyên viết: luyện viết câu 54 và biểu đồ nâng cao.', 5, 6, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'),
    ('Giao tiếp tiếng Hàn A1','GIAOTIEP-A1','Lớp giao tiếp tiếng Hàn cơ bản A1.', 1, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days')
)
INSERT INTO classes(name,code,description,level_from,level_to,status,teacher_id,start_date,end_date,created_at,updated_at)
SELECT k.name,k.code,k.description,k.level_from,k.level_to,'ACTIVE',t.id,k.start_date::date,k.end_date::date,NOW(),NOW() FROM klass_rows k CROSS JOIN teacher t;

INSERT INTO class_admins(class_id, admin_id)
SELECT c.id, u.id FROM classes c JOIN users u ON (c.code = 'TOPIK23-FOUNDATION' AND u.email = 'admin.chieu@hoanobita.com') OR (c.code = 'TOPIK34-INTENSIVE' AND u.email = 'admin.dem@hoanobita.com') OR (c.code = 'TOPIK56-WRITING' AND u.email = 'admin.chieu@hoanobita.com') OR (c.code = 'GIAOTIEP-A1' AND u.email = 'admin.dem@hoanobita.com');

INSERT INTO class_members(class_id, student_id, status, joined_at)
SELECT c.id, u.id, 'ACTIVE', NOW()
FROM classes c JOIN users u ON (c.code = 'TOPIK23-FOUNDATION' AND u.email LIKE 'student.chieu%@hoanobita.com') OR (c.code = 'TOPIK34-INTENSIVE' AND u.email LIKE 'student.dem%@hoanobita.com') OR (c.code = 'TOPIK56-WRITING' AND u.email LIKE 'student.viet%@hoanobita.com') OR (c.code = 'GIAOTIEP-A1' AND u.email LIKE 'student.giaotiep%@hoanobita.com');

-- Lessons and materials: 2 lessons + 3 materials per class.
INSERT INTO lessons(class_id,title,description,lesson_date,order_index,status,created_at,updated_at,created_by)
SELECT c.id, v.title, v.description, CURRENT_DATE + (v.order_index - 1), v.order_index, 'PUBLISHED', NOW(), NOW(), c.teacher_id
FROM classes c CROSS JOIN (VALUES
  ('Buổi 1: Khai giảng và chiến lược TOPIK','Giới thiệu lộ trình học, cách phân bổ thời gian và bài kiểm tra đầu vào.',1),
  ('Buổi 2: Nghe hiểu và đọc hiểu nền tảng','Luyện nghe part 1-2, đọc đoạn ngắn và ôn ngữ pháp thường gặp.',2)
) v(title,description,order_index);

INSERT INTO materials(class_id,title,description,external_url,visible,created_at,updated_at,created_by)
SELECT c.id, v.title, v.description, v.url, true, NOW(), NOW(), c.teacher_id
FROM classes c CROSS JOIN (VALUES
  ('Giáo trình TOPIK 3-4 tuần 1','Tài liệu PDF tổng hợp ngữ pháp, từ vựng và bài đọc tuần 1.','https://example.com/hoa-nobita/topik34-week1.pdf'),
  ('Audio luyện nghe tuần 1','Danh sách file nghe dùng cho bài tập Nghe - Tuần 1.','https://example.com/hoa-nobita/topik34-listening-week1'),
  ('Bảng từ vựng chủ đề trường học','Từ vựng trọng tâm kèm ví dụ câu tiếng Hàn và tiếng Việt.','https://example.com/hoa-nobita/topik34-vocab-school')
) v(title,description,url);

-- 4 assignments per class.
INSERT INTO assignments(class_id,title,description,instruction,due_at,max_score,status,allow_resubmit,created_at,updated_at,created_by)
SELECT c.id, v.title, v.description, v.instruction, NOW() + (v.days || ' days')::interval, v.max_score, v.status, true, NOW(), NOW(), c.teacher_id
FROM classes c CROSS JOIN (VALUES
  ('Bài tập Nghe - Tuần 1','Luyện nghe chọn đáp án và ghi chú từ khóa.','Nghe audio tuần 1, làm câu 1-20 và ghi lại 5 từ khóa khó.',7,100,'PUBLISHED'),
  ('Bài tập Đọc - Tuần 1','Đọc hiểu đoạn văn ngắn theo dạng TOPIK II.','Hoàn thành bài đọc trang 12-18 và giải thích 3 câu sai.',8,100,'PUBLISHED'),
  ('Bài tập Từ vựng - Tuần 1','Ôn 50 từ vựng chủ đề trường học.','Đặt 10 câu ví dụ bằng tiếng Hàn với từ vựng đã học.',9,100,'PUBLISHED'),
  ('Bài tập Viết - Câu 53','Viết phân tích biểu đồ theo cấu trúc TOPIK.','Viết 200-300 chữ, có mở bài, số liệu chính và nhận xét xu hướng.',10,30,'PUBLISHED')
) v(title,description,instruction,days,max_score,status);

-- Mixed submissions: first 15 students/class submit Nghe + Đọc, first 8 submit Viết, first 4 submit Từ vựng. Most submitted work is graded.
WITH class_students AS (
  SELECT c.id AS class_id, u.id AS student_id, u.full_name, row_number() OVER (PARTITION BY c.id ORDER BY u.email) AS rn
  FROM classes c JOIN class_members cm ON cm.class_id = c.id JOIN users u ON u.id = cm.student_id
), sub_rows AS (
  SELECT a.id AS assignment_id, cs.student_id, cs.full_name, cs.rn, a.title, a.max_score
  FROM assignments a JOIN class_students cs ON cs.class_id = a.class_id
  WHERE (a.title LIKE 'Bài tập Nghe%' AND cs.rn <= 15)
     OR (a.title LIKE 'Bài tập Đọc%' AND cs.rn <= 15)
     OR (a.title LIKE 'Bài tập Viết%' AND cs.rn <= 8)
     OR (a.title LIKE 'Bài tập Từ vựng%' AND cs.rn <= 4)
), inserted_subs AS (
  INSERT INTO submissions(assignment_id,student_id,content_text,status,submitted_at,created_at,updated_at,created_by)
  SELECT assignment_id, student_id,
         CASE WHEN title LIKE 'Bài tập Viết%' THEN 'Bài viết của ' || full_name || ': biểu đồ cho thấy xu hướng tăng rõ rệt trong giai đoạn 2010-2020...'
              WHEN title LIKE 'Bài tập Từ vựng%' THEN 'Em đã đặt câu với các từ vựng trọng tâm và tự kiểm tra phát âm.'
              ELSE 'Em đã hoàn thành bài ' || title || ' và ghi chú các lỗi cần sửa.' END,
         CASE WHEN rn % 11 = 0 THEN 'RESUBMIT_REQUESTED' ELSE 'SUBMITTED' END,
         NOW() - (rn || ' hours')::interval, NOW(), NOW(), student_id
  FROM sub_rows
  RETURNING id, assignment_id, student_id
)
INSERT INTO grades(submission_id,score,feedback,graded_by,graded_at,created_at,updated_at)
SELECT s.id,
       CASE WHEN a.max_score = 30 THEN (20 + (abs(hashtext(u.email)) % 9))::numeric ELSE (72 + (abs(hashtext(u.email)) % 21))::numeric END,
       CASE WHEN a.title LIKE 'Bài tập Viết%' THEN 'Bố cục rõ, cần đa dạng hoá liên từ và mẫu câu.' ELSE 'Bài làm tốt, chú ý sửa các lỗi nhỏ đã ghi chú.' END,
       COALESCE(ca.admin_id, c.teacher_id), NOW(), NOW(), NOW()
FROM inserted_subs s JOIN assignments a ON a.id = s.assignment_id JOIN classes c ON c.id = a.class_id JOIN users u ON u.id = s.student_id LEFT JOIN class_admins ca ON ca.class_id = c.id
WHERE (abs(hashtext(u.email || a.title)) % 5) <> 0;

-- Notifications.
INSERT INTO notifications(title,content,target_type,target_id,created_by,created_at)
SELECT 'Chào mừng đến với Hoà Nobita Korean Platform','Chúc các bạn học TOPIK hiệu quả, nộp bài đúng hạn và theo dõi phản hồi sau mỗi buổi học.','ALL',NULL,u.id,NOW() FROM users u WHERE u.email='hoateacher@hoanobita.com';
INSERT INTO notifications(title,content,target_type,target_id,created_by,created_at)
SELECT 'Lịch học lớp Chiều tuần này','Lớp Chiều học lúc 14:00, vui lòng xem trước tài liệu nghe tuần 1.','CLASS',c.id,u.id,NOW() FROM classes c JOIN users u ON u.email='admin.chieu@hoanobita.com' WHERE c.code='TOPIK34-CHIEU';
INSERT INTO notifications(title,content,target_type,target_id,created_by,created_at)
SELECT 'Lịch học lớp Đêm tuần này','Lớp Đêm học lúc 19:30, chuẩn bị bài đọc và từ vựng trước buổi học.','CLASS',c.id,u.id,NOW() FROM classes c JOIN users u ON u.email='admin.dem@hoanobita.com' WHERE c.code='TOPIK34-DEM';

-- Activity feed evidence.
INSERT INTO activity_logs(id,actor_id,actor_name,action_type,target_type,target_id,target_name,class_id,message,created_at)
SELECT gen_random_uuid(), u.id, u.full_name, 'DEMO_SEEDED', 'CLASS', c.id, c.name, c.id, 'Đã chuẩn bị dữ liệu demo ổn định cho ' || c.name, NOW()
FROM classes c JOIN users u ON u.email='hoateacher@hoanobita.com';
INSERT INTO activity_logs(id,actor_id,actor_name,action_type,target_type,target_id,target_name,class_id,message,created_at)
SELECT gen_random_uuid(), u.id, u.full_name, 'GRADE_CREATED', 'ASSIGNMENT', a.id, a.title, a.class_id, 'Đã chấm một nhóm bài nộp cho ' || a.title, NOW() - INTERVAL '1 hour'
FROM assignments a JOIN classes c ON c.id=a.class_id JOIN class_admins ca ON ca.class_id=c.id JOIN users u ON u.id=ca.admin_id
WHERE a.title LIKE 'Bài tập Nghe%';

COMMIT;

SELECT 'users_total' AS metric, COUNT(*)::text AS value FROM users WHERE deleted_at IS NULL
UNION ALL SELECT 'teachers', COUNT(*)::text FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='TEACHER_OWNER' AND u.deleted_at IS NULL
UNION ALL SELECT 'class_admins', COUNT(*)::text FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='CLASS_ADMIN' AND u.deleted_at IS NULL
UNION ALL SELECT 'students', COUNT(*)::text FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.name='STUDENT' AND u.deleted_at IS NULL
UNION ALL SELECT 'classes', COUNT(*)::text FROM classes WHERE deleted_at IS NULL
UNION ALL SELECT 'class_members', COUNT(*)::text FROM class_members WHERE status='ACTIVE'
UNION ALL SELECT 'lessons', COUNT(*)::text FROM lessons WHERE deleted_at IS NULL
UNION ALL SELECT 'materials', COUNT(*)::text FROM materials WHERE deleted_at IS NULL
UNION ALL SELECT 'assignments', COUNT(*)::text FROM assignments WHERE deleted_at IS NULL
UNION ALL SELECT 'submissions', COUNT(*)::text FROM submissions WHERE deleted_at IS NULL
UNION ALL SELECT 'grades', COUNT(*)::text FROM grades
UNION ALL SELECT 'notifications', COUNT(*)::text FROM notifications
UNION ALL SELECT 'activity_logs', COUNT(*)::text FROM activity_logs;
SQL

cat <<'INFO'
[seed] Demo accounts ready (all password: Password123!)
[seed] hoateacher@hoanobita.com      — Nguyễn Tuấn Hoà / TEACHER_OWNER
[seed] admin.chieu@hoanobita.com  — Admin Kiên / CLASS_ADMIN / TOPIK34-CHIEU
[seed] admin.dem@hoanobita.com    — Admin Quân / CLASS_ADMIN / TOPIK34-DEM
[seed] student.chieu1@hoanobita.com, student.chieu2@hoanobita.com — sample Chiều students
[seed] student.dem1@hoanobita.com, student.dem2@hoanobita.com     — sample Đêm students
INFO
log "Deterministic demo data seeded successfully."
