package com.hoanobita.topikplatform.attendance;

import com.hoanobita.topikplatform.attendance.dto.AttendanceBulkRequest;
import com.hoanobita.topikplatform.attendance.dto.AttendanceResponse;
import com.hoanobita.topikplatform.attendance.dto.AttendanceSummaryResponse;
import com.hoanobita.topikplatform.attendance.dto.AttendanceUpdateRequest;
import com.hoanobita.topikplatform.attendance.dto.StudentAttendanceSummaryResponse;
import com.hoanobita.topikplatform.attendance.entity.Attendance;
import com.hoanobita.topikplatform.attendance.repository.AttendanceRepository;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.AttendanceStatus;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PaginationUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.lesson.entity.Lesson;
import com.hoanobita.topikplatform.lesson.repository.LessonRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AttendanceService {
    private final AttendanceRepository attendanceRepo;
    private final LessonRepository lessonRepo;
    private final ClassMemberRepository classMemberRepo;
    private final KlassRepository klassRepo;
    private final UserRepository userRepo;
    private final PermissionService permissions;
    private final SecurityUtils security;

    public AttendanceService(AttendanceRepository attendanceRepo, LessonRepository lessonRepo,
                             ClassMemberRepository classMemberRepo, KlassRepository klassRepo,
                             UserRepository userRepo, PermissionService permissions, SecurityUtils security) {
        this.attendanceRepo = attendanceRepo;
        this.lessonRepo = lessonRepo;
        this.classMemberRepo = classMemberRepo;
        this.klassRepo = klassRepo;
        this.userRepo = userRepo;
        this.permissions = permissions;
        this.security = security;
    }

    public AttendanceSummaryResponse summary(UUID classId) {
        User currentUser = security.currentUser();
        permissions.requireAccessClass(currentUser, classId);

        List<Lesson> lessons = lessonRepo.findByClassId(classId);
        List<UUID> lessonIds = lessons.stream().map(Lesson::getId).toList();
        List<Attendance> records = lessonIds.isEmpty() ? List.of() : attendanceRepo.findByLessonIdIn(lessonIds);
        List<ClassMember> members = classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE);

        Map<UUID, List<Attendance>> recordsByStudent = new HashMap<>();
        for (Attendance record : records) {
            recordsByStudent.computeIfAbsent(record.getStudentId(), key -> new ArrayList<>()).add(record);
        }

        List<StudentAttendanceSummaryResponse> studentAttendance = members.stream().map(member -> {
            User student = userRepo.findById(member.getStudentId()).orElse(null);
            List<Attendance> studentRecords = recordsByStudent.getOrDefault(member.getStudentId(), List.of());
            int present = (int) studentRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            int absent = (int) studentRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
            int late = (int) studentRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            BigDecimal rate = lessons.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(present + late)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(lessons.size()), 2, RoundingMode.HALF_UP);
            return new StudentAttendanceSummaryResponse(
                    member.getStudentId(),
                    student == null ? "Không xác định" : student.getFullName(),
                    student == null ? null : student.getEmail(),
                    present,
                    absent,
                    late,
                    rate
            );
        }).toList();

        long presentOrLate = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT || r.getStatus() == AttendanceStatus.LATE).count();
        int expected = lessons.size() * members.size();
        BigDecimal attendanceRate = expected == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(presentOrLate)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(expected), 2, RoundingMode.HALF_UP);

        return new AttendanceSummaryResponse(classId, lessons.size(), attendanceRate, studentAttendance);
    }

    @Transactional
    public List<AttendanceResponse> markLessonAttendance(UUID lessonId, AttendanceBulkRequest request) {
        Lesson lesson = lesson(lessonId);
        User currentUser = security.currentUser();
        permissions.requireManageClass(currentUser, lesson.getClassId());
        if (request == null || request.records() == null || request.records().isEmpty()) {
            throw BusinessException.badRequest("Danh sách bản ghi không được rỗng");
        }

        List<AttendanceResponse> responses = new ArrayList<>();
        for (var item : request.records()) {
            if (item.studentId() == null) throw BusinessException.badRequest("studentId là bắt buộc");
            boolean isActiveMember = classMemberRepo.existsByClassIdAndStudentIdAndStatus(lesson.getClassId(), item.studentId(), MemberStatus.ACTIVE);
            if (!isActiveMember) throw BusinessException.badRequest("Học viên không hoạt động trong lớp này: " + item.studentId());

            Attendance attendance = attendanceRepo.findByLessonIdAndStudentId(lessonId, item.studentId()).orElseGet(Attendance::new);
            attendance.setLessonId(lessonId);
            attendance.setStudentId(item.studentId());
            attendance.setStatus(parseStatus(item.status()));
            attendance.setNote(item.note());
            if (attendance.getCreatedBy() == null) attendance.setCreatedBy(currentUser.getId());
            attendance.setUpdatedBy(currentUser.getId());
            responses.add(toResponse(attendanceRepo.save(attendance)));
        }
        return responses;
    }

    public PageResponse<AttendanceResponse> lessonAttendance(UUID lessonId, Integer page, Integer size) {
        Lesson lesson = lesson(lessonId);
        permissions.requireAccessClass(security.currentUser(), lesson.getClassId());
        List<AttendanceResponse> all = attendanceRepo.findByLessonId(lessonId).stream().map(this::toResponse).toList();
        int p = PaginationUtil.normalizePage(page);
        int s = PaginationUtil.normalizeSize(size);
        return PaginationUtil.paginate(all, p, s);
    }

    public PageResponse<AttendanceResponse> studentAttendance(UUID studentId, Integer page, Integer size) {
        User currentUser = security.currentUser();
        if (currentUser.isStudent() && !currentUser.getId().equals(studentId)) {
            throw BusinessException.forbidden("Bạn chỉ có thể xem điểm danh của chính mình");
        }
        if (currentUser.isAdmin() && !currentUser.isTeacher() && !currentUser.getId().equals(studentId)
                && !permissions.canAccessStudentProgress(currentUser, studentId)) {
            throw BusinessException.forbidden("Bạn chỉ có thể xem điểm danh của học viên trong lớp được phân công");
        }
        var pageable = PageableUtil.of(page, size, java.util.Set.of("createdAt", "status"));
        var paged = attendanceRepo.findByStudentIdPaged(studentId, pageable);
        var filtered = paged.getContent().stream()
                .filter(record -> currentUser.isTeacher() || currentUser.isStudent() || canAccessRecordClass(currentUser, record))
                .map(this::toResponse)
                .toList();
        return PageResponse.of(filtered, paged.getNumber() + 1, paged.getSize(), paged.getTotalElements());
    }

    @Transactional
    public AttendanceResponse update(UUID id, AttendanceUpdateRequest request) {
        Attendance attendance = attendanceRepo.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy bản ghi điểm danh"));
        Lesson lesson = lesson(attendance.getLessonId());
        User currentUser = security.currentUser();
        permissions.requireManageClass(currentUser, lesson.getClassId());

        if (request.status() != null) attendance.setStatus(parseStatus(request.status()));
        if (request.note() != null) attendance.setNote(request.note());
        attendance.setUpdatedBy(currentUser.getId());
        return toResponse(attendanceRepo.save(attendance));
    }

    private boolean canAccessRecordClass(User currentUser, Attendance record) {
        Lesson lesson = lessonRepo.findActiveById(record.getLessonId()).orElse(null);
        return lesson != null && permissions.canAccessClass(currentUser, lesson.getClassId());
    }

    private AttendanceStatus parseStatus(String value) {
        if (value == null || value.isBlank()) throw BusinessException.badRequest("Trạng thái là bắt buộc");
        try {
            return AttendanceStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw BusinessException.badRequest("Trạng thái điểm danh không hợp lệ: " + value);
        }
    }

    private Lesson lesson(UUID lessonId) {
        return lessonRepo.findActiveById(lessonId).orElseThrow(() -> BusinessException.notFound("Không tìm thấy buổi học"));
    }

    private AttendanceResponse toResponse(Attendance attendance) {
        Lesson lesson = lessonRepo.findById(attendance.getLessonId()).orElse(null);
        var klass = lesson == null ? null : klassRepo.findById(lesson.getClassId()).orElse(null);
        User student = userRepo.findById(attendance.getStudentId()).orElse(null);
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getLessonId(),
                lesson == null ? null : lesson.getTitle(),
                lesson == null ? null : lesson.getClassId(),
                klass == null ? null : klass.getName(),
                attendance.getStudentId(),
                student == null ? "Unknown" : student.getFullName(),
                student == null ? null : student.getEmail(),
                attendance.getStatus().name(),
                attendance.getNote(),
                attendance.getCreatedBy(),
                attendance.getCreatedAt()
        );
    }
}
