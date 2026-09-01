package com.hoanobita.topikplatform.dashboard;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.dashboard.dto.AdminDashboardResponse;
import com.hoanobita.topikplatform.dashboard.dto.StudentDashboardResponse;
import com.hoanobita.topikplatform.dashboard.dto.TeacherDashboardResponse;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final KlassRepository klassRepo;
    private final ClassAdminRepository classAdminRepo;
    private final ClassMemberRepository classMemberRepo;
    private final UserRepository userRepo;
    private final AssignmentRepository assignmentRepo;
    private final SubmissionRepository submissionRepo;

    public DashboardService(KlassRepository klassRepo, ClassAdminRepository classAdminRepo,
                            ClassMemberRepository classMemberRepo, UserRepository userRepo,
                            AssignmentRepository assignmentRepo, SubmissionRepository submissionRepo) {
        this.klassRepo = klassRepo;
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
    }

    // ==================== TEACHER DASHBOARD ====================
    public TeacherDashboardResponse getTeacherDashboard(User teacher) {
        if (!teacher.isTeacher()) {
            throw BusinessException.forbidden("Chỉ giáo viên mới có thể truy cập bảng điều khiển giáo viên");
        }

        List<Klass> allClasses = klassRepo.findAllActive();
        List<Assignment> allAssignments = assignmentRepo.findAllActive();
        List<Submission> allSubmissions = submissionRepo.findAllActive();
        Instant now = Instant.now();

        long activeClasses = allClasses.stream().filter(k -> k.getStatus() == ClassStatus.ACTIVE).count();

        Set<UUID> activeStudentIds = new HashSet<>(classMemberRepo.findStudentIdsWithActiveMembership());
        int activeStudentCount = activeStudentIds.size();

        Instant dueSoonThreshold = now.plus(48, ChronoUnit.HOURS);
        long dueSoon48h = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isAfter(now) && a.getDueAt().isBefore(dueSoonThreshold))
                .count();

        Map<UUID, List<Assignment>> assignmentsByClass = allAssignments.stream()
                .collect(Collectors.groupingBy(Assignment::getClassId));
        Map<UUID, List<Submission>> submissionsByAssignment = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getAssignmentId));

        List<TeacherDashboardResponse.NeedGradingByClass> needGradingByClass = allClasses.stream()
                .map(k -> {
                    List<Assignment> classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    long classNeedGrading = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED)
                            .count();
                    return new TeacherDashboardResponse.NeedGradingByClass(k.getId(), k.getName(), classNeedGrading);
                })
                .filter(c -> c.count() > 0)
                .toList();

        return new TeacherDashboardResponse((int) activeClasses, activeStudentCount, (int) dueSoon48h, needGradingByClass);
    }

    // ==================== ADMIN DASHBOARD ====================
    public AdminDashboardResponse getAdminDashboard(User admin) {
        if (!admin.isAdmin()) {
            throw BusinessException.forbidden("Chỉ quản trị viên lớp mới có thể truy cập bảng điều khiển quản trị");
        }

        List<UUID> assignedClassIds = classAdminRepo.findClassIdsByAdminId(admin.getId());
        List<Assignment> assignedAssignments = assignmentRepo.findByClassIdIn(assignedClassIds);
        List<Submission> assignedSubmissions = submissionRepo.findByAssignmentIdIn(
                assignedAssignments.stream().map(Assignment::getId).toList());
        Instant now = Instant.now();

        Instant dueSoonThreshold = now.plus(48, ChronoUnit.HOURS);
        long dueSoon = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(dueSoonThreshold))
                .count();

        Map<UUID, Integer> activeStudentCountByClass = new HashMap<>();
        for (UUID classId : assignedClassIds) {
            activeStudentCountByClass.put(classId, classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE).size());
        }
        long submitted = assignedSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE)
                .count();
        long expectedSubmissionCount = 0;
        for (UUID classId : assignedClassIds) {
            int studentCount = activeStudentCountByClass.getOrDefault(classId, 0);
            int assignmentCount = (int) assignedAssignments.stream().filter(a -> a.getClassId().equals(classId)).count();
            expectedSubmissionCount += (long) studentCount * assignmentCount;
        }
        long missing = Math.max(expectedSubmissionCount - submitted, 0);

        Map<UUID, Klass> classById = klassRepo.findAllActive().stream()
                .collect(Collectors.toMap(Klass::getId, k -> k, (a, b) -> a));

        List<AdminDashboardResponse.AssignmentDueSoon> assignmentsDueSoon = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isAfter(now) && a.getDueAt().isBefore(dueSoonThreshold))
                .sorted(Comparator.comparing(Assignment::getDueAt))
                .limit(10)
                .map(a -> {
                    Klass k = classById.get(a.getClassId());
                    String className = k != null ? k.getName() : "";
                    return new AdminDashboardResponse.AssignmentDueSoon(a.getId(), a.getTitle(), a.getClassId(), className, a.getDueAt());
                })
                .toList();

        return new AdminDashboardResponse((int) dueSoon, (int) missing, assignmentsDueSoon);
    }

    // ==================== STUDENT DASHBOARD ====================
    public StudentDashboardResponse getStudentDashboard(User student) {
        if (!student.isStudent()) {
            throw BusinessException.forbidden("Chỉ học viên mới có thể truy cập bảng điều khiển học viên");
        }

        List<UUID> joinedClassIds = classMemberRepo.findClassIdsByStudentId(student.getId());
        List<Assignment> classAssignments = assignmentRepo.findByClassIdIn(joinedClassIds);
        List<Assignment> openAssignments = classAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED)
                .toList();

        List<Submission> mySubmissions = submissionRepo.findByStudentId(student.getId());

        Instant now = Instant.now();
        Instant dueSoonThreshold = now.plus(48, ChronoUnit.HOURS);
        long dueSoon = openAssignments.stream()
                .filter(a -> a.getDueAt() != null && a.getDueAt().isAfter(now) && a.getDueAt().isBefore(dueSoonThreshold))
                .count();

        long graded = mySubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).count();
        long resubmit = mySubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED).count();

        return new StudentDashboardResponse(joinedClassIds.size(), openAssignments.size(), (int) dueSoon, (int) graded, (int) resubmit);
    }
}

