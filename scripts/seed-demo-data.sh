#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
need(){ command -v "$1" >/dev/null || { echo "$1 is required"; exit 1; }; }
need curl; need jq
log(){ echo "[seed] $*"; }
req(){ local m="$1" p="$2" t="${3:-}" b="${4:-}"; curl -s -X "$m" "$BASE_URL$p" -H 'Content-Type: application/json' ${t:+-H "Authorization: Bearer $t"} ${b:+-d "$b"}; }
login(){ req POST /auth/login '' "{\"identifier\":\"$1\",\"password\":\"$2\"}" | jq -r '.data.accessToken // empty'; }
T=$(login teacher@hoanobita.com Password123!); A=$(login admin@hoanobita.com Password123!); S1=$(login student1@hoanobita.com Password123!); S2=$(login student2@hoanobita.com Password123!)
[[ -z "$T" || -z "$A" || -z "$S1" || -z "$S2" ]] && { echo "Seed accounts are not available. Start backend and verify DataInitializer."; exit 1; }
SUFFIX=${DEMO_SUFFIX:-$(date +%s)}
ADMIN_ID=$(req GET /auth/me "$A" | jq -r '.data.id')
S1_ID=$(req GET /auth/me "$S1" | jq -r '.data.id')
S2_ID=$(req GET /auth/me "$S2" | jq -r '.data.id')
log "Creating demo data suffix $SUFFIX"
students=("$S1_ID:$S1" "$S2_ID:$S2")
for i in $(seq 1 12); do
  body="{\"fullName\":\"Học viên Demo $i\",\"email\":\"demo$i-$SUFFIX@hoanobita.com\",\"phone\":\"091$SUFFIX$i\",\"role\":\"STUDENT\"}"
  res=$(req POST /users "$T" "$body")
  id=$(echo "$res" | jq -r '.data.id // empty')
  pass=$(echo "$res" | jq -r '.data.temporaryPassword // empty')
  tok=""
  [[ -n "$pass" ]] && tok=$(login "demo$i-$SUFFIX@hoanobita.com" "$pass")
  [[ -n "$id" ]] && students+=("$id:$tok")
done
classes=("TOPIK 2-3 Foundation" "TOPIK 3-4 Intensive" "TOPIK 5-6 Writing Clinic" "Giao tiếp tiếng Hàn A1")
idx=0
for name in "${classes[@]}"; do
  code="DEMO-$SUFFIX-$idx"
  class=$(req POST /classes "$T" "{\"name\":\"$name\",\"code\":\"$code\",\"description\":\"Lớp demo với nội dung học TOPIK thực tế.\",\"levelFrom\":1,\"levelTo\":6,\"status\":\"ACTIVE\"}")
  cid=$(echo "$class" | jq -r '.data.id')
  log "Class $name -> $cid"
  req POST /classes/$cid/admins "$T" "{\"userId\":\"$ADMIN_ID\"}" >/dev/null
  assigned=("${students[$idx]}" "${students[$((idx+4))]}" "${students[$((idx+8))]}")
  for pair in "${assigned[@]}"; do sid="${pair%%:*}"; req POST /classes/$cid/students "$T" "{\"userId\":\"$sid\"}" >/dev/null; done

  for l in 1 2 3; do
    req POST /classes/$cid/lessons "$T" "{\"title\":\"Buổi $l: Ngữ pháp trọng tâm tuần $l\",\"description\":\"Luyện nghe, đọc và viết theo chủ đề.\",\"orderIndex\":$l,\"status\":\"PUBLISHED\"}" >/dev/null
  done
  for mat in "Từ vựng chủ đề trường học" "Mẫu câu viết TOPIK câu 53" "Checklist làm bài nghe" "Ngữ pháp trọng tâm tuần 2"; do
    req POST /classes/$cid/materials "$T" "{\"title\":\"$mat\",\"description\":\"Tài liệu học tập có ví dụ tiếng Hàn và giải thích tiếng Việt.\",\"externalUrl\":\"https://example.com/$SUFFIX/$idx\",\"visible\":true}" >/dev/null
  done

  draft=$(req POST /classes/$cid/assignments "$T" "{\"title\":\"Nháp: chuẩn bị bài nói tuần $idx\",\"instruction\":\"Giáo viên đang biên soạn.\",\"maxScore\":10,\"status\":\"DRAFT\",\"allowResubmit\":true}" | jq -r '.data.id')
  published=$(req POST /classes/$cid/assignments "$T" "{\"title\":\"Viết đoạn văn giới thiệu bản thân\",\"instruction\":\"Viết 200 chữ bằng tiếng Hàn.\",\"dueAt\":\"2099-12-31T23:59:59Z\",\"maxScore\":10,\"status\":\"PUBLISHED\",\"allowResubmit\":true}" | jq -r '.data.id')
  late=$(req POST /classes/$cid/assignments "$T" "{\"title\":\"Bài nộp muộn: luyện đọc hiểu TOPIK\",\"instruction\":\"Nộp sau hạn để minh hoạ trạng thái LATE.\",\"dueAt\":\"2000-01-01T00:00:00Z\",\"maxScore\":10,\"status\":\"PUBLISHED\",\"allowResubmit\":true}" | jq -r '.data.id')
  closed=$(req POST /classes/$cid/assignments "$T" "{\"title\":\"Đã đóng: Viết biểu đồ TOPIK câu 53\",\"instruction\":\"Bài đã hết hạn nhận nộp.\",\"maxScore\":10,\"status\":\"PUBLISHED\",\"allowResubmit\":false}" | jq -r '.data.id')
  req PATCH /assignments/$closed/close "$T" >/dev/null

  first_token="${assigned[0]#*:}"
  second_token="${assigned[1]#*:}"
  if [[ -n "$first_token" ]]; then
    sub=$(req POST /assignments/$published/submissions "$first_token" '{"contentText":"저는 베트남에서 온 학생입니다. 한국어를 열심히 공부합니다."}' | jq -r '.data.id // empty')
    [[ -n "$sub" ]] && req POST /submissions/$sub/grade "$T" '{"score":8.5,"feedback":"Bố cục rõ ràng, từ vựng phù hợp. Cần luyện thêm liên kết câu."}' >/dev/null
  fi
  if [[ -n "$second_token" ]]; then
    late_sub=$(req POST /assignments/$late/submissions "$second_token" '{"contentText":"늦게 제출했지만 내용을 완성했습니다."}' | jq -r '.data.id // empty')
    if [[ -n "$late_sub" ]]; then
      req POST /submissions/$late_sub/grade "$T" '{"score":7.0,"feedback":"Nội dung đạt yêu cầu nhưng nộp muộn. Cần chú ý hạn nộp."}' >/dev/null
      req POST /submissions/$late_sub/request-resubmit "$T" >/dev/null
    fi
  fi
  req POST /notifications "$T" "{\"title\":\"Bài tập mới trong $name\",\"content\":\"Lớp có bài DRAFT, PUBLISHED, CLOSED và ví dụ bài nộp đã chấm.\",\"targetType\":\"CLASS\",\"targetId\":\"$cid\"}" >/dev/null
  log "Demo class completed: $name (draft=$draft published=$published late=$late closed=$closed)"
  idx=$((idx+1))
done
log "Demo data created. Login accounts: teacher/admin/student1/student2 all use Password123!"
