package com.hoanobita.topikplatform.classroom;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.dto.*;
import com.hoanobita.topikplatform.classroom.entity.*;
import com.hoanobita.topikplatform.classroom.repository.*;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PaginationUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.dto.StatusRequest;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ClassroomService {
    private static final String CLASS_NOT_FOUND = "Class not found";
    private static final String ENTITY_CLASS = "CLASS";
    private static final String UNKNOWN = "Unknown";
    private static final String TO_CLASS_SUFFIX = " vào lớp";


    private final KlassRepository klassRepo;
    private final ClassAdminRepository classAdminRepo;
    private final ClassMemberRepository classMemberRepo;
    private final UserRepository userRepo;
    private final PermissionService permissionService;
    private final ActivityService activityService;
    private final AssignmentRepository assignmentRepo;
    private final SubmissionRepository submissionRepo;
    private final GradeRepository gradeRepo;

    public ClassroomService(KlassRepository klassRepo, ClassAdminRepository classAdminRepo,
                            ClassMemberRepository classMemberRepo, UserRepository userRepo,
                            PermissionService permissionService, ActivityService activityService,
                            AssignmentRepository assignmentRepo, SubmissionRepository submissionRepo,
                            GradeRepository gradeRepo) {
        this.klassRepo = klassRepo;
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
        this.userRepo = userRepo;
        this.permissionService = permissionService;
        this.activityService = activityService;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
        this.gradeRepo = gradeRepo;
    }

    public PageResponse<ClassResponse> listClasses(User currentUser, Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PaginationUtil.normalizePage(page);
        int normalizedSize = PaginationUtil.normalizeSize(size);

        List<Klass> classes;
        if (currentUser.isTeacher()) {
            classes = klassRepo.findAllActive();
        } else if (currentUser.isAdmin()) {
            var classIds = classAdminRepo.findClassIdsByAdminId(currentUser.getId());
            classes = klassRepo.findAllActive().stream()
                    .filter(k -> classIds.contains(k.getId()))
                    .toList();
        } else {
            // Student
            var classIds = classMemberRepo.findClassIdsByStudentId(currentUser.getId());
            classes = klassRepo.findAllActive().stream()
                    .filter(k -> classIds.contains(k.getId()))
                    .toList();
        }

            List<ClassResponse> filtered = classes.stream()
                .map(this::toResponse)
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.name(), keyword)
                        || containsIgnoreCase(item.code(), keyword)
                        || containsIgnoreCase(item.description(), keyword);
                })
                .toList();

            Comparator<ClassResponse> defaultSort = Comparator.comparing(ClassResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
            Comparator<ClassResponse> comparator = PaginationUtil.resolveSort(sort, Map.of(
                "createdAt", Comparator.comparing(ClassResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())),
                "name", Comparator.comparing(ClassResponse::name, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "code", Comparator.comparing(ClassResponse::code, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "status", Comparator.comparing(ClassResponse::status, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
            ), defaultSort);

            List<ClassResponse> sorted = filtered.stream().sorted(comparator).toList();
            return PaginationUtil.paginate(sorted, normalizedPage, normalizedSize);
    }

    public ClassResponse getClassById(UUID classId, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));
        permissionService.requireAccessClass(currentUser, classId);
        return toResponse(klass);
    }

    @Transactional
    public ClassResponse createClass(CreateClassRequest request, User currentUser) {
        permissionService.requireTeacher(currentUser);

        if (klassRepo.existsByCode(request.code())) {
            throw BusinessException.conflict("Class code already exists");
        }

        if (request.levelFrom() != null && request.levelTo() != null && request.levelFrom() > request.levelTo()) {
            throw BusinessException.badRequest("level_from must be <= level_to");
        }

        var klass = new Klass();
        klass.setName(request.name());
        klass.setCode(request.code());
        klass.setDescription(request.description());
        klass.setLevelFrom(request.levelFrom());
        klass.setLevelTo(request.levelTo());
        klass.setTeacherId(currentUser.getId());
        klass.setCreatedBy(currentUser.getId());
        if (request.startDate() != null) klass.setStartDate(LocalDate.parse(request.startDate()));
        if (request.endDate() != null) klass.setEndDate(LocalDate.parse(request.endDate()));

        klass = klassRepo.save(klass);
        activityService.log("CLASS_CREATED", ENTITY_CLASS, klass.getId(), klass.getName(), klass.getId(), "Đã tạo lớp học mới: " + klass.getName());
        return toResponse(klass);
    }

    @Transactional
    public ClassResponse updateClass(UUID classId, UpdateClassRequest request, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
            .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));
        permissionService.requireManageClass(currentUser, classId);

        if (request.name() != null) klass.setName(request.name());
        if (request.description() != null) klass.setDescription(request.description());
        if (request.levelFrom() != null) klass.setLevelFrom(request.levelFrom());
        if (request.levelTo() != null) klass.setLevelTo(request.levelTo());

        if (request.levelFrom() != null && request.levelTo() != null && request.levelFrom() > request.levelTo()) {
            throw BusinessException.badRequest("level_from must be <= level_to");
        }

        if (request.status() != null) {
            try {
                klass.setStatus(ClassStatus.valueOf(request.status()));
            } catch (IllegalArgumentException e) {
                throw BusinessException.badRequest("Invalid status: " + request.status());
            }
        }
        if (request.startDate() != null) klass.setStartDate(LocalDate.parse(request.startDate()));
        if (request.endDate() != null) klass.setEndDate(LocalDate.parse(request.endDate()));

        klass.setUpdatedBy(currentUser.getId());
        klass = klassRepo.save(klass);
        activityService.log("CLASS_UPDATED", ENTITY_CLASS, klass.getId(), klass.getName(), klass.getId(), "Đã cập nhật thông tin lớp học: " + klass.getName());
        return toResponse(klass);
    }

    @Transactional
    public void deleteClass(UUID classId, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
            .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));
        permissionService.requireTeacher(currentUser);
        klass.softDelete();
        klassRepo.save(klass);
        activityService.log("CLASS_DELETED", ENTITY_CLASS, klass.getId(), klass.getName(), klass.getId(), "Đã xóa lớp học: " + klass.getName());
    }

    // --- Admin management ---

    @Transactional
    public void addAdmin(UUID classId, AddMemberRequest request, User currentUser) {
        permissionService.requireTeacher(currentUser);
        klassRepo.findActiveById(classId)
            .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));

        UUID adminId = request.resolvedAdminId();
        if (adminId == null) throw BusinessException.badRequest("adminId is required");

        var admin = userRepo.findActiveById(adminId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        if (!admin.isAdmin()) throw BusinessException.badRequest("User must have CLASS_ADMIN role");

        if (classAdminRepo.existsByClassIdAndAdminId(classId, adminId)) {
            throw BusinessException.conflict("Admin already assigned to this class");
        }

        classAdminRepo.save(new ClassAdmin(classId, adminId));
        activityService.log("CLASS_ADMIN_ADDED", "USER", adminId, admin.getFullName(), classId, "Đã thêm trợ giảng " + admin.getFullName() + TO_CLASS_SUFFIX);
    }

    @Transactional
    public void removeAdmin(UUID classId, UUID adminId, User currentUser) {
        permissionService.requireTeacher(currentUser);
        var admin = userRepo.findActiveById(adminId).orElse(null);
        classAdminRepo.deleteByClassIdAndAdminId(classId, adminId);
        if (admin != null) {
            activityService.log("CLASS_ADMIN_REMOVED", "USER", adminId, admin.getFullName(), classId, "Đã xóa trợ giảng " + admin.getFullName() + " khỏi lớp");
        }
    }

    // --- Student management ---

    @Transactional
    public void addStudent(UUID classId, AddMemberRequest request, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        klassRepo.findActiveById(classId)
            .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));

        UUID studentId = request.resolvedStudentId();
        if (studentId == null) throw BusinessException.badRequest("studentId is required");

        var student = userRepo.findActiveById(studentId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        if (!student.isStudent()) throw BusinessException.badRequest("User must have STUDENT role");

        var existing = classMemberRepo.findByClassIdAndStudentId(classId, studentId);
        if (existing.isPresent()) {
            var member = existing.get();
            if (member.getStatus() == MemberStatus.ACTIVE) {
                throw BusinessException.conflict("Student already in this class");
            }
            // Re-activate if previously removed
            member.setStatus(MemberStatus.ACTIVE);
            member.setRemovedAt(null);
            classMemberRepo.save(member);
        } else {
            var member = new ClassMember();
            member.setClassId(classId);
            member.setStudentId(studentId);
            member.setStatus(MemberStatus.ACTIVE);
            classMemberRepo.save(member);
        }
        activityService.log("CLASS_STUDENT_ADDED", "USER", studentId, student.getFullName(), classId, "Đã thêm học viên " + student.getFullName() + TO_CLASS_SUFFIX);
    }

    @Transactional
    @SuppressWarnings({"java:S135"})
    public BulkAddStudentsResult addStudentsBulk(UUID classId, List<UUID> studentIds, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));

        if (studentIds == null || studentIds.isEmpty()) {
            throw BusinessException.badRequest("studentIds must not be empty");
        }

        int added = 0;
        int reactivated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (UUID studentId : studentIds) {
            if (studentId == null) {
                skipped++;
                errors.add("Skipped null studentId");
                continue;
            }

            var studentOpt = userRepo.findActiveById(studentId);
            if (studentOpt.isEmpty()) {
                skipped++;
                errors.add("User not found: " + studentId);
                continue;
            }

            var student = studentOpt.get();
            if (!student.isStudent()) {
                skipped++;
                errors.add("User is not STUDENT: " + studentId);
                continue;
            }

            var existing = classMemberRepo.findByClassIdAndStudentId(classId, studentId);
            if (existing.isPresent()) {
                var member = existing.get();
                if (member.getStatus() == MemberStatus.ACTIVE) {
                    skipped++;
                    continue;
                }

                member.setStatus(MemberStatus.ACTIVE);
                member.setRemovedAt(null);
                classMemberRepo.save(member);
                reactivated++;
                activityService.log("CLASS_STUDENT_REACTIVATED", "USER", studentId, student.getFullName(), classId, "Đã kích hoạt lại học viên " + student.getFullName() + " trong lớp");
                continue;
            }

            var member = new ClassMember();
            member.setClassId(classId);
            member.setStudentId(studentId);
            member.setStatus(MemberStatus.ACTIVE);
            classMemberRepo.save(member);
            added++;
            activityService.log("CLASS_STUDENT_ADDED", "USER", studentId, student.getFullName(), classId, "Đã thêm học viên " + student.getFullName() + TO_CLASS_SUFFIX);
        }

        return new BulkAddStudentsResult(added, reactivated, skipped, errors);
    }

    @Transactional
    public void removeStudent(UUID classId, UUID studentId, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        var member = classMemberRepo.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> BusinessException.notFound("Student not in this class"));
        
        member.setStatus(MemberStatus.REMOVED);
        member.setRemovedAt(Instant.now());
        classMemberRepo.save(member);
        
        var student = userRepo.findActiveById(studentId).orElse(null);
        if (student != null) {
            activityService.log("CLASS_STUDENT_REMOVED", "USER", studentId, student.getFullName(), classId, "Đã xóa học viên " + student.getFullName() + " khỏi lớp");
        }
    }

    @Transactional
    public void updateStudentStatus(UUID classId, UUID studentId, StatusRequest request, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        var member = classMemberRepo.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> BusinessException.notFound("Student not in class"));
        try {
            member.setStatus(MemberStatus.valueOf(request.status()));
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid status: " + request.status());
        }
        classMemberRepo.save(member);
    }

    public PageResponse<StudentMemberResponse> listStudents(UUID classId, User currentUser, Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PaginationUtil.normalizePage(page);
        int normalizedSize = PaginationUtil.normalizeSize(size);

        permissionService.requireAccessClass(currentUser, classId);
        var members = classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE);
        List<StudentMemberResponse> filtered = members.stream().map(m -> {
            var student = userRepo.findById(m.getStudentId()).orElse(null);
            String name = student != null ? student.getFullName() : UNKNOWN;
            String email = student != null ? student.getEmail() : null;
            return new StudentMemberResponse(m.getStudentId(), m.getStudentCode(), name, email, m.getStatus().name(), m.getJoinedAt());
        })
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.fullName(), keyword)
                            || containsIgnoreCase(item.email(), keyword);
                })
                .toList();

        Comparator<StudentMemberResponse> defaultSort = Comparator.comparing(StudentMemberResponse::joinedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        Comparator<StudentMemberResponse> comparator = PaginationUtil.resolveSort(sort, Map.of(
                "joinedAt", Comparator.comparing(StudentMemberResponse::joinedAt, Comparator.nullsLast(Comparator.naturalOrder())),
                "fullName", Comparator.comparing(StudentMemberResponse::fullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "email", Comparator.comparing(StudentMemberResponse::email, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "status", Comparator.comparing(StudentMemberResponse::status, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        ), defaultSort);

        List<StudentMemberResponse> sorted = filtered.stream().sorted(comparator).toList();
        return PaginationUtil.paginate(sorted, normalizedPage, normalizedSize);
    }

    public ClassStatsResponse getClassStats(UUID classId, User currentUser) {
        permissionService.requireAccessClass(currentUser, classId);
        klassRepo.findActiveById(classId)
            .orElseThrow(() -> BusinessException.notFound(CLASS_NOT_FOUND));

        int totalStudents = classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE).size();
        var assignments = assignmentRepo.findByClassId(classId);
        int totalAssignments = assignments.size();

        List<Submission> submissions = assignments.stream()
                .flatMap(assignment -> submissionRepo.findByAssignmentId(assignment.getId()).stream())
                .toList();

        int totalSubmissions = submissions.size();
        int lateSubmissions = (int) submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
        int gradedSubmissions = (int) submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).count();
        int needGrading = (int) submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();

        int expectedSubmissions = totalStudents * totalAssignments;
        int missingSubmissions = Math.max(expectedSubmissions - totalSubmissions, 0);

        BigDecimal submissionRate = BigDecimal.ZERO;
        if (expectedSubmissions > 0) {
            submissionRate = BigDecimal.valueOf(totalSubmissions)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(expectedSubmissions), 2, RoundingMode.HALF_UP);
        }

        List<Grade> grades = assignments.stream()
                .flatMap(assignment -> gradeRepo.findByAssignmentId(assignment.getId()).stream())
                .toList();

        BigDecimal averageScore = BigDecimal.ZERO;
        if (!grades.isEmpty()) {
            averageScore = grades.stream()
                    .map(Grade::getScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(grades.size()), 2, RoundingMode.HALF_UP);
        }

        return new ClassStatsResponse(
                classId,
                totalStudents,
                totalAssignments,
                totalSubmissions,
                missingSubmissions,
                lateSubmissions,
                gradedSubmissions,
                needGrading,
                submissionRate,
                averageScore
        );
    }

    private ClassResponse toResponse(Klass klass) {
        var teacher = userRepo.findById(klass.getTeacherId()).orElse(null);
        String teacherName = teacher != null ? teacher.getFullName() : UNKNOWN;

        var admins = classAdminRepo.findByClassId(klass.getId()).stream()
                .map(ca -> {
                    var admin = userRepo.findById(ca.getAdminId()).orElse(null);
                    String name = admin != null ? admin.getFullName() : UNKNOWN;
                    return new ClassResponse.AdminInfo(ca.getAdminId(), name);
                })
                .toList();

        int studentCount = classMemberRepo.findByClassIdAndStatus(klass.getId(), MemberStatus.ACTIVE).size();

        return new ClassResponse(
                klass.getId(), klass.getName(), klass.getCode(), klass.getDescription(),
                klass.getLevelFrom(), klass.getLevelTo(), klass.getStatus().name(),
                klass.getTeacherId(), teacherName, klass.getStartDate(), klass.getEndDate(),
                studentCount, admins, klass.getCreatedAt()
        );
    }

    public String exportStudentsCsv(UUID classId, User currentUser) {
        permissionService.requireAccessClass(currentUser, classId);
        StringBuilder csv = new StringBuilder("studentCode,fullName,email,status,joinedAt\n");
        for (ClassMember member : classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE)) {
            var student = userRepo.findById(member.getStudentId()).orElse(null);
            csv.append(csv(member.getStudentCode())).append(',')
                    .append(csv(student == null ? UNKNOWN : student.getFullName())).append(',')
                    .append(csv(student == null ? null : student.getEmail())).append(',')
                    .append(member.getStatus().name()).append(',')
                    .append(member.getJoinedAt()).append('\n');
        }
        return csv.toString();
    }

    @Transactional
    public StudentMemberResponse updateStudentCode(UUID classId, UUID studentId, StudentCodeRequest request, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        var member = classMemberRepo.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> BusinessException.notFound("Student not in this class"));
        String studentCode = request == null ? null : request.studentCode();
        if (studentCode != null && !studentCode.isBlank()
                && !studentCode.equals(member.getStudentCode())
                && classMemberRepo.existsByClassIdAndStudentCode(classId, studentCode)) {
            throw BusinessException.conflict("Student code already exists in this class");
        }
        member.setStudentCode(studentCode == null || studentCode.isBlank() ? null : studentCode);
        member = classMemberRepo.save(member);
        var student = userRepo.findById(studentId).orElse(null);
        return new StudentMemberResponse(
                studentId,
                member.getStudentCode(),
                student == null ? UNKNOWN : student.getFullName(),
                student == null ? null : student.getEmail(),
                member.getStatus().name(),
                member.getJoinedAt()
        );
    }

    public record StudentMemberResponse(UUID id, String studentCode, String fullName, String email, String status, Instant joinedAt) {}

    public record BulkAddStudentsResult(int added, int reactivated, int skipped, List<String> errors) {}

    private String csv(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
