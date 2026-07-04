package com.hoanobita.topikplatform.dashboard;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.activity.dto.ActivityResponse;
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
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.material.entity.Material;
import com.hoanobita.topikplatform.material.repository.MaterialRepository;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.risk.RiskDetectionService;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {
        private static final String ROUTE_CLASSES = "/classes";
        private static final String ROUTE_ASSIGNMENTS = "/assignments";


    private final KlassRepository klassRepo;
    private final ClassAdminRepository classAdminRepo;
    private final ClassMemberRepository classMemberRepo;
    private final UserRepository userRepo;
    private final AssignmentRepository assignmentRepo;
    private final SubmissionRepository submissionRepo;
    private final GradeRepository gradeRepo;
    private final MaterialRepository materialRepo;
    private final NotificationRepository notificationRepo;
    private final ActivityService activityService;
        private final RiskDetectionService riskDetectionService;

    public DashboardService(KlassRepository klassRepo, ClassAdminRepository classAdminRepo,
                            ClassMemberRepository classMemberRepo, UserRepository userRepo,
                            AssignmentRepository assignmentRepo, SubmissionRepository submissionRepo,
                            GradeRepository gradeRepo, MaterialRepository materialRepo,
                            NotificationRepository notificationRepo, ActivityService activityService,
                            RiskDetectionService riskDetectionService) {
        this.klassRepo = klassRepo;
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
        this.gradeRepo = gradeRepo;
        this.materialRepo = materialRepo;
        this.notificationRepo = notificationRepo;
        this.activityService = activityService;
        this.riskDetectionService = riskDetectionService;
    }

    // ==================== TEACHER DASHBOARD ====================
        @SuppressWarnings({"java:S3776", "java:S6541", "java:S1192", "java:S135"})
    public TeacherDashboardResponse getTeacherDashboard(User teacher) {
        if (!teacher.isTeacher()) {
            throw BusinessException.forbidden("Only TEACHER_OWNER can access teacher dashboard");
        }

        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        List<Klass> allClasses = klassRepo.findAllActive();
        List<Assignment> allAssignments = assignmentRepo.findAllActive();
        List<Submission> allSubmissions = submissionRepo.findAllActive();
        List<Grade> allGrades = gradeRepo.findAllActive();
        List<Material> allMaterials = materialRepo.findAllActive();
        List<Notification> allNotifications = notificationRepo.findAllActive();
        Instant now = Instant.now();

        Map<UUID, List<Assignment>> assignmentsByClass = allAssignments.stream()
                .collect(Collectors.groupingBy(Assignment::getClassId));
        Map<UUID, List<Submission>> submissionsByAssignment = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getAssignmentId));

        Map<UUID, Integer> activeStudentCountByClass = new HashMap<>();
        for (Klass klass : allClasses) {
            int activeCount = classMemberRepo.findByClassIdAndStatus(klass.getId(), MemberStatus.ACTIVE).size();
            activeStudentCountByClass.put(klass.getId(), activeCount);
        }

        // KPI calculations
        long activeClasses = allClasses.stream().filter(k -> k.getStatus() == ClassStatus.ACTIVE).count();
        long completedClasses = allClasses.stream().filter(k -> k.getStatus() == ClassStatus.COMPLETED).count();
        long draftClasses = allClasses.stream().filter(k -> k.getStatus() == ClassStatus.DRAFT).count();
        long archivedClasses = allClasses.stream().filter(k -> k.getStatus() == ClassStatus.ARCHIVED).count();

        List<User> allStudents = userRepo.findAllActive().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleName.STUDENT))
                .toList();
        long activeStudents = allStudents.stream().filter(u -> u.getStatus() == UserStatus.ACTIVE).count();
        long suspendedStudents = allStudents.stream().filter(u -> u.getStatus() == UserStatus.SUSPENDED).count();
        long inactiveStudents = allStudents.stream().filter(u -> u.getStatus() == UserStatus.INACTIVE).count();

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long newStudents7d = allStudents.stream().filter(u -> u.getCreatedAt().isAfter(sevenDaysAgo)).count();
        long newStudents30d = allStudents.stream().filter(u -> u.getCreatedAt().isAfter(thirtyDaysAgo)).count();

        long unassignedStudents = allStudents.stream()
                .filter(u -> classMemberRepo.findClassIdsByStudentId(u.getId()).isEmpty())
                .count();

        long draftAssignments = allAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.DRAFT).count();
        long publishedAssignments = allAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED).count();
        long closedAssignments = allAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.CLOSED).count();

        Instant dueSoonThreshold = now.plus(48, ChronoUnit.HOURS);
        long dueSoon48h = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isAfter(now) && a.getDueAt().isBefore(dueSoonThreshold))
                .count();
        long overdueAssignments = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(now))
                .count();

        long submittedSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE || s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED).count();
        long lateSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
        long needGrading = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
        long gradedSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).count();
        long resubmitRequested = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED).count();

        long expectedSubmissions = 0;
        for (Klass klass : allClasses) {
            int classStudentCount = activeStudentCountByClass.getOrDefault(klass.getId(), 0);
            int classAssignmentCount = assignmentsByClass.getOrDefault(klass.getId(), List.of()).size();
            expectedSubmissions += (long) classStudentCount * classAssignmentCount;
        }
        long missingSubs = Math.max(expectedSubmissions - submittedSubs, 0);

        long visibleMaterials = allMaterials.stream().filter(m -> m.isVisible()).count();
        long hiddenMaterials = allMaterials.stream().filter(m -> !m.isVisible()).count();
        Instant recentThreshold = Instant.now().minus(7, ChronoUnit.DAYS);
        long newMaterials = allMaterials.stream().filter(m -> m.getCreatedAt().isAfter(recentThreshold)).count();

        Instant notif7d = Instant.now().minus(7, ChronoUnit.DAYS);
        long sentLast7d = allNotifications.stream().filter(n -> n.getCreatedAt().isAfter(notif7d)).count();
        long globalNotifs = allNotifications.stream().filter(n -> n.getTargetType() == TargetType.ALL).count();
        long classNotifs = allNotifications.stream().filter(n -> n.getTargetType() == TargetType.CLASS).count();

        // Charts
        List<TeacherDashboardResponse.StatusCount> classStatusChart = List.of(
                new TeacherDashboardResponse.StatusCount("ACTIVE", activeClasses),
                new TeacherDashboardResponse.StatusCount("DRAFT/UPCOMING", draftClasses),
                new TeacherDashboardResponse.StatusCount("COMPLETED", completedClasses),
                new TeacherDashboardResponse.StatusCount("ARCHIVED", archivedClasses)
        );

        List<TeacherDashboardResponse.SubmissionRateByClass> submissionRateByClass = allClasses.stream()
                .limit(10)
                .map(k -> {
                    List<Assignment> classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    List<Submission> classSubmissions = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .toList();
                    long classSubmitted = classSubmissions.stream()
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE || s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED)
                            .count();
                    long classLate = classSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
                    int classStudentCount = activeStudentCountByClass.getOrDefault(k.getId(), 0);
                    long classExpected = (long) classAssignments.size() * classStudentCount;
                    long classMissing = Math.max(0, classExpected - classSubmitted);
                    return new TeacherDashboardResponse.SubmissionRateByClass(k.getId(), k.getName(), classSubmitted, classMissing, classLate);
                })
                .toList();

        List<TeacherDashboardResponse.NeedGradingByClass> needGradingByClass = allClasses.stream()
                .limit(10)
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

        List<TeacherDashboardResponse.AverageScoreByClass> avgScoreByClass = allClasses.stream()
                .limit(10)
                .map(k -> {
                    List<Assignment> classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    List<Grade> classGrades = classAssignments.stream()
                            .flatMap(a -> gradeRepo.findByAssignmentId(a.getId()).stream())
                            .toList();
                    BigDecimal avg = classGrades.isEmpty() ? BigDecimal.ZERO :
                            classGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .divide(BigDecimal.valueOf(classGrades.size()), 2, RoundingMode.HALF_UP);
                    return new TeacherDashboardResponse.AverageScoreByClass(k.getId(), k.getName(), avg, BigDecimal.TEN);
                })
                .filter(c -> c.averageScore().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        List<TeacherDashboardResponse.GradeDistribution> gradeDist = List.of(
                new TeacherDashboardResponse.GradeDistribution("0-40", allGrades.stream().filter(g -> g.getScore().compareTo(new BigDecimal("4")) <= 0).count()),
                new TeacherDashboardResponse.GradeDistribution("40-60", allGrades.stream().filter(g -> g.getScore().compareTo(new BigDecimal("4")) > 0 && g.getScore().compareTo(new BigDecimal("6")) <= 0).count()),
                new TeacherDashboardResponse.GradeDistribution("60-80", allGrades.stream().filter(g -> g.getScore().compareTo(new BigDecimal("6")) > 0 && g.getScore().compareTo(new BigDecimal("8")) <= 0).count()),
                new TeacherDashboardResponse.GradeDistribution("80-100", allGrades.stream().filter(g -> g.getScore().compareTo(new BigDecimal("8")) > 0).count())
        );

        List<TeacherDashboardResponse.StatusCount> assignmentWorkflow = List.of(
                new TeacherDashboardResponse.StatusCount("DRAFT", draftAssignments),
                new TeacherDashboardResponse.StatusCount("PUBLISHED", publishedAssignments),
                new TeacherDashboardResponse.StatusCount("CLOSED", closedAssignments),
                new TeacherDashboardResponse.StatusCount("OVERDUE", overdueAssignments),
                new TeacherDashboardResponse.StatusCount("NEED_GRADING", needGrading)
        );

        // Recent Activity
        List<ActivityResponse> recentActivity = activityService.recentForCurrentUser();

        // Today tasks
        List<TeacherDashboardResponse.TodayTask> todayTasks = new ArrayList<>();
        if (needGrading > 0) {
                        todayTasks.add(new TeacherDashboardResponse.TodayTask("t1", "GRADING", needGrading + " bài nộp đang chờ chấm", "Có " + needGrading + " bài nộp cần chấm điểm", "HIGH", ROUTE_CLASSES, "Chấm ngay"));
        }
        if (dueSoon48h > 0) {
                        todayTasks.add(new TeacherDashboardResponse.TodayTask("t2", "DEADLINE", dueSoon48h + " bài tập sắp hết hạn trong 48 giờ", "Kiểm tra và nhắc nhở học viên", "HIGH", ROUTE_ASSIGNMENTS, "Xem bài tập"));
        }
        if (resubmitRequested > 0) {
                        todayTasks.add(new TeacherDashboardResponse.TodayTask("t3", "RESUBMIT", resubmitRequested + " bài nộp được yêu cầu nộp lại", "Theo dõi học viên nộp lại", "MEDIUM", ROUTE_ASSIGNMENTS, "Xem chi tiết"));
        }
                if (missingSubs > 0) {
                                                todayTasks.add(new TeacherDashboardResponse.TodayTask("t4", "MISSING", missingSubs + " lượt chưa nộp bài", "Danh sách học viên thiếu bài nộp cần được nhắc nhở", "HIGH", ROUTE_CLASSES, "Gửi nhắc nhở"));
        }

        // Class health (top 8)
        List<TeacherDashboardResponse.ClassHealth> classHealth = allClasses.stream()
                .limit(8)
                .map(k -> {
                    int studentCount = activeStudentCountByClass.getOrDefault(k.getId(), 0);
                    List<String> adminNames = classAdminRepo.findByClassId(k.getId()).stream()
                            .map(ca -> userRepo.findById(ca.getAdminId()).map(u -> u.getFullName()).orElse(""))
                            .filter(n -> !n.isEmpty()).limit(2).toList();
                    List<Assignment> classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    int openAssignments = (int) classAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED).count();
                    List<Submission> classSubmissions = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .toList();
                    long classSubs = classSubmissions.stream()
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE || s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED)
                            .count();
                    BigDecimal subRate = studentCount > 0 && !classAssignments.isEmpty() ?
                            BigDecimal.valueOf(classSubs).multiply(BigDecimal.valueOf(100))
                                    .divide(BigDecimal.valueOf((long) classAssignments.size() * studentCount), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    long classNeedGrading = classSubmissions.stream()
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
                    List<Grade> classGrades = classAssignments.stream().flatMap(a -> gradeRepo.findByAssignmentId(a.getId()).stream()).toList();
                    BigDecimal avgScore = classGrades.isEmpty() ? BigDecimal.ZERO :
                            classGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .divide(BigDecimal.valueOf(classGrades.size()), 2, RoundingMode.HALF_UP);
                    List<String> issues = new ArrayList<>();
                    if (subRate.compareTo(new BigDecimal("60")) < 0) issues.add("Tỷ lệ nộp bài thấp");
                    if (classNeedGrading > 5) issues.add("Nhiều bài cần chấm");
                    return new TeacherDashboardResponse.ClassHealth(k.getId(), k.getName(), studentCount, adminNames, openAssignments, subRate, (int) classNeedGrading, avgScore, k.getStatus().name(), issues, "/classes/" + k.getId());
                })
                .toList();

        // Assignments due soon
        Instant upcomingThreshold = now.plus(7, ChronoUnit.DAYS);
        List<TeacherDashboardResponse.AssignmentDueSoon> dueSoon = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isAfter(now) && a.getDueAt().isBefore(upcomingThreshold))
                .sorted(Comparator.comparing(Assignment::getDueAt))
                .limit(8)
                .map(a -> {
                    Klass k = klassRepo.findActiveById(a.getClassId()).orElse(null);
                    String className = k != null ? k.getName() : "Unknown";
                    List<Submission> subs = submissionsByAssignment.getOrDefault(a.getId(), List.of());
                    long submitted = subs.size();
                    long late = subs.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
                    int needGrade = (int) subs.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
                    int totalStudents = activeStudentCountByClass.getOrDefault(a.getClassId(), 0);
                    return new TeacherDashboardResponse.AssignmentDueSoon(a.getId(), a.getTitle(), a.getClassId(), className, a.getDueAt(), a.getStatus().name(), submitted, totalStudents, late, needGrade, "/assignments/" + a.getId() + "/submissions");
                })
                .toList();

        // Risk students calculated by rule-based detector.
        List<TeacherDashboardResponse.RiskStudent> riskStudents = allStudents.stream()
                .map(s -> {
                    List<UUID> classIds = classMemberRepo.findClassIdsByStudentId(s.getId());
                    if (classIds.isEmpty()) {
                        return null;
                    }

                    var risk = riskDetectionService.evaluateStudentAcrossClasses(s.getId(), classIds);
                    if ("LOW".equals(risk.riskLevel())) {
                        return null;
                    }

                    UUID classId = classIds.getFirst();
                    Klass k = klassRepo.findActiveById(classId).orElse(null);
                    String className = k != null ? k.getName() : "";

                    String issue = String.join("; ", risk.reasons());
                    return new TeacherDashboardResponse.RiskStudent(
                            s.getId(),
                            s.getFullName(),
                            s.getEmail(),
                            s.getPhone(),
                            classId,
                            className,
                            risk.submissionRatePercent(),
                            risk.averageScorePercent(),
                            issue,
                            risk.riskLevel(),
                            "/users/" + s.getId()
                    );
                })
                .filter(Objects::nonNull)
                .limit(6)
                .toList();

        BigDecimal gradingAverageScore = allGrades.isEmpty() ? BigDecimal.ZERO :
                allGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(allGrades.size()), 2, RoundingMode.HALF_UP);
        long passCount = allGrades.stream().filter(g -> g.getScore().compareTo(BigDecimal.valueOf(6)) >= 0).count();
        BigDecimal passRate = allGrades.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(passCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(allGrades.size()), 2, RoundingMode.HALF_UP);

        TeacherDashboardResponse.KpiSection kpi = new TeacherDashboardResponse.KpiSection(
                new TeacherDashboardResponse.ClassKpi(allClasses.size(), (int) activeClasses, (int) completedClasses, (int) draftClasses, (int) archivedClasses, (int) draftClasses),
                new TeacherDashboardResponse.StudentKpi(allStudents.size(), (int) activeStudents, (int) suspendedStudents, (int) inactiveStudents, (int) newStudents7d, (int) newStudents30d, (int) unassignedStudents),
                new TeacherDashboardResponse.AssignmentKpi(allAssignments.size(), (int) draftAssignments, (int) publishedAssignments, (int) closedAssignments, (int) dueSoon48h, (int) overdueAssignments),
                new TeacherDashboardResponse.SubmissionKpi((int) submittedSubs, (int) missingSubs, (int) lateSubs, (int) needGrading, (int) gradedSubs, (int) resubmitRequested),
                new TeacherDashboardResponse.GradingKpi((int) needGrading, gradingAverageScore, passRate, BigDecimal.ZERO),
                new TeacherDashboardResponse.MaterialKpi(allMaterials.size(), (int) visibleMaterials, (int) hiddenMaterials, (int) newMaterials),
                new TeacherDashboardResponse.NotificationKpi((int) sentLast7d, (int) globalNotifs, (int) classNotifs)
        );

        TeacherDashboardResponse.ChartsSection charts = new TeacherDashboardResponse.ChartsSection(
                classStatusChart, submissionRateByClass, needGradingByClass, avgScoreByClass, gradeDist, assignmentWorkflow
        );

        int todayActionCount = todayTasks.size() + (int) needGrading + (int) dueSoon48h + (int) Math.min(missingSubs, Integer.MAX_VALUE);
        int overdueMissing = (int) Math.min(overdueAssignments + missingSubs, Integer.MAX_VALUE);

        // Map ActivityLogResponse to TeacherDashboardResponse.RecentActivity
        List<TeacherDashboardResponse.RecentActivity> mappedRecentActivity = recentActivity.stream()
                .map(log -> new TeacherDashboardResponse.RecentActivity(
                        log.id().toString(),
                        log.actionType(),
                        log.message(),
                        log.actorName(),
                        log.targetName() != null ? log.targetName() : "",
                        log.createdAt(),
                        "#"
                ))
                .toList();

        return new TeacherDashboardResponse(today, teacher.getFullName(), todayActionCount, (int) activeClasses, (int) activeStudents, (int) needGrading, overdueMissing, kpi, charts, todayTasks, classHealth, dueSoon, riskStudents, mappedRecentActivity);
    }

    // ==================== ADMIN DASHBOARD ====================
        @SuppressWarnings({"java:S3776", "java:S6541", "java:S135"})
    public AdminDashboardResponse getAdminDashboard(User admin) {
        if (!admin.isAdmin()) {
            throw BusinessException.forbidden("Only CLASS_ADMIN can access admin dashboard");
        }

        List<UUID> assignedClassIds = classAdminRepo.findClassIdsByAdminId(admin.getId());
        List<Klass> assignedClasses = klassRepo.findAllActive().stream()
                .filter(k -> assignedClassIds.contains(k.getId()))
                .toList();

                if (assignedClassIds.isEmpty()) {
                        return new AdminDashboardResponse(
                                        0,
                                        0,
                                        0,
                                        0,
                                        new AdminDashboardResponse.KpiSection(
                                                        new AdminDashboardResponse.ClassKpi(0, 0),
                                                        new AdminDashboardResponse.StudentKpi(0, 0, 0),
                                                        new AdminDashboardResponse.AssignmentKpi(0, 0, 0, 0),
                                                        new AdminDashboardResponse.SubmissionKpi(0, 0, 0, 0),
                                                        new AdminDashboardResponse.ScoreKpi(BigDecimal.ZERO, 0)
                                        ),
                                        new AdminDashboardResponse.ChartsSection(List.of(), List.of(), List.of(), List.of(), List.of()),
                                        List.of(),
                                        List.of()
                        );
                }

                List<Assignment> assignedAssignments = assignmentRepo.findByClassIdIn(assignedClassIds);
        List<Submission> assignedSubmissions = submissionRepo.findByAssignmentIdIn(assignedAssignments.stream().map(Assignment::getId).toList());
                Map<UUID, List<Assignment>> assignmentsByClass = assignedAssignments.stream()
                                .collect(Collectors.groupingBy(Assignment::getClassId));
                Map<UUID, List<Submission>> submissionsByAssignment = assignedSubmissions.stream()
                                .collect(Collectors.groupingBy(Submission::getAssignmentId));

                Map<UUID, Integer> activeStudentCountByClass = new HashMap<>();
                for (Klass klass : assignedClasses) {
                        int count = classMemberRepo.findByClassIdAndStatus(klass.getId(), MemberStatus.ACTIVE).size();
                        activeStudentCountByClass.put(klass.getId(), count);
                }

                int totalInAssignedClasses = activeStudentCountByClass.values().stream().mapToInt(Integer::intValue).sum();
                int activeStudentCount = 0;
                int suspendedStudentCount = 0;
                Set<UUID> distinctStudentIds = new HashSet<>();
                for (Klass klass : assignedClasses) {
                        var members = classMemberRepo.findByClassIdAndStatus(klass.getId(), MemberStatus.ACTIVE);
                        for (var member : members) {
                                if (!distinctStudentIds.add(member.getStudentId())) {
                                        continue;
                                }
                                var student = userRepo.findById(member.getStudentId()).orElse(null);
                                if (student == null) {
                                        continue;
                                }
                                if (student.getStatus() == UserStatus.ACTIVE) {
                                        activeStudentCount++;
                                } else if (student.getStatus() == UserStatus.SUSPENDED) {
                                        suspendedStudentCount++;
                                }
                        }
                }

        long published = assignedAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED).count();
        long closed = assignedAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.CLOSED).count();
        Instant dueSoonThreshold = Instant.now().plus(48, ChronoUnit.HOURS);
        long dueSoon = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(dueSoonThreshold))
                .count();
        long overdue = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(Instant.now()))
                .count();

                long submitted = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE).count();
                long expectedSubmissionCount = 0;
                for (Klass klass : assignedClasses) {
                        int studentCount = activeStudentCountByClass.getOrDefault(klass.getId(), 0);
                        int assignmentCount = assignmentsByClass.getOrDefault(klass.getId(), List.of()).size();
                        expectedSubmissionCount += (long) studentCount * assignmentCount;
                }
                long missing = Math.max(expectedSubmissionCount - submitted, 0);
        long needGrading = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
        long late = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();

        List<Grade> assignedGrades = gradeRepo.findByAssignmentIds(assignedAssignments.stream().map(Assignment::getId).toList());
        BigDecimal avgScore = assignedGrades.isEmpty() ? BigDecimal.ZERO :
                assignedGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(assignedGrades.size()), 2, RoundingMode.HALF_UP);

        List<AdminDashboardResponse.TodayTask> tasks = new ArrayList<>();
        if (needGrading > 0) {
                        tasks.add(new AdminDashboardResponse.TodayTask("a1", "GRADING", needGrading + " bài cần chấm", "Lớp được phân công", "HIGH", ROUTE_CLASSES, "Chấm bài"));
        }
        if (dueSoon > 0) {
                        tasks.add(new AdminDashboardResponse.TodayTask("a2", "DEADLINE", dueSoon + " bài tập sắp đến hạn", "Nhắc nhở học viên", "HIGH", ROUTE_ASSIGNMENTS, "Xem"));
        }
        if (missing > 5) {
                        tasks.add(new AdminDashboardResponse.TodayTask("a3", "MISSING", missing + " học viên chưa nộp", "Gửi nhắc nhở", "MEDIUM", ROUTE_CLASSES, "Xem"));
        }

        List<AdminDashboardResponse.SubmissionRateByClass> subRate = assignedClasses.stream()
                .limit(6)
                .map(k -> {
                    var classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    long classSubmitted = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED || s.getStatus() == SubmissionStatus.LATE)
                            .count();
                    long classLate = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.LATE)
                            .count();
                    int classStudents = activeStudentCountByClass.getOrDefault(k.getId(), 0);
                    long classExpected = (long) classStudents * classAssignments.size();
                    long classMissing = Math.max(classExpected - classSubmitted, 0);
                    return new AdminDashboardResponse.SubmissionRateByClass(k.getId(), k.getName(), classSubmitted, classMissing, classLate);
                })
                .toList();

        List<AdminDashboardResponse.NeedGradingByClass> needGradeByClass = assignedClasses.stream()
                .limit(6)
                .map(k -> {
                    var classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    long classNeedGrading = classAssignments.stream()
                            .flatMap(a -> submissionsByAssignment.getOrDefault(a.getId(), List.of()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED)
                            .count();
                    return new AdminDashboardResponse.NeedGradingByClass(k.getId(), k.getName(), classNeedGrading);
                })
                .toList();

        List<AdminDashboardResponse.AverageScoreByClass> avgByClass = assignedClasses.stream()
                .limit(6)
                .map(k -> {
                    var classAssignments = assignmentsByClass.getOrDefault(k.getId(), List.of());
                    var classGrades = classAssignments.stream()
                            .flatMap(a -> gradeRepo.findByAssignmentId(a.getId()).stream())
                            .toList();
                    BigDecimal classAvg = classGrades.isEmpty()
                            ? BigDecimal.ZERO
                            : classGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(BigDecimal.valueOf(classGrades.size()), 2, RoundingMode.HALF_UP);
                    return new AdminDashboardResponse.AverageScoreByClass(k.getId(), k.getName(), classAvg);
                })
                .toList();

        int belowThresholdStudents = 0;
        for (UUID studentId : distinctStudentIds) {
            var studentSubmissions = assignedSubmissions.stream().filter(s -> s.getStudentId().equals(studentId)).toList();
            if (studentSubmissions.isEmpty()) {
                continue;
            }
            var studentGrades = studentSubmissions.stream().flatMap(s -> gradeRepo.findBySubmissionIdList(s.getId()).stream()).toList();
            if (studentGrades.isEmpty()) {
                continue;
            }
            BigDecimal studentAvg = studentGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(studentGrades.size()), 2, RoundingMode.HALF_UP);
            if (studentAvg.compareTo(BigDecimal.valueOf(6)) < 0) {
                belowThresholdStudents++;
            }
        }

        AdminDashboardResponse.KpiSection kpi = new AdminDashboardResponse.KpiSection(
                new AdminDashboardResponse.ClassKpi(assignedClasses.size(), (int) assignedClasses.stream().filter(k -> k.getStatus() == ClassStatus.ACTIVE).count()),
                new AdminDashboardResponse.StudentKpi(totalInAssignedClasses, activeStudentCount, suspendedStudentCount),
                new AdminDashboardResponse.AssignmentKpi((int) published, (int) closed, (int) dueSoon, (int) overdue),
                new AdminDashboardResponse.SubmissionKpi((int) submitted, (int) missing, (int) needGrading, (int) late),
                new AdminDashboardResponse.ScoreKpi(avgScore, belowThresholdStudents)
        );

        AdminDashboardResponse.ChartsSection charts = new AdminDashboardResponse.ChartsSection(
                subRate, needGradeByClass, avgByClass,
                List.of(new AdminDashboardResponse.StatusCount("ACTIVE", activeStudentCount), new AdminDashboardResponse.StatusCount("SUSPENDED", suspendedStudentCount)),
                List.of(
                        new AdminDashboardResponse.StatusCount("DRAFT", assignedAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.DRAFT).count()),
                        new AdminDashboardResponse.StatusCount("PUBLISHED", published),
                        new AdminDashboardResponse.StatusCount("CLOSED", closed)
                )
        );

        // Recent Activity
        List<ActivityResponse> recentActivity = activityService.recentForCurrentUser();
        List<TeacherDashboardResponse.RecentActivity> mappedRecentActivity = recentActivity.stream()
                .map(log -> new TeacherDashboardResponse.RecentActivity(
                        log.id().toString(),
                        log.actionType(),
                        log.message(),
                        log.actorName(),
                        log.targetName() != null ? log.targetName() : "",
                        log.createdAt(),
                        "#"
                ))
                .toList();

        return new AdminDashboardResponse(assignedClasses.size(), (int) needGrading, (int) dueSoon, (int) missing, kpi, charts, tasks, mappedRecentActivity);
    }

    // ==================== STUDENT DASHBOARD ====================
        @SuppressWarnings({"java:S3776"})
    public StudentDashboardResponse getStudentDashboard(User student) {
        if (!student.isStudent()) {
            throw BusinessException.forbidden("Only STUDENT can access student dashboard");
        }

        List<UUID> joinedClassIds = classMemberRepo.findClassIdsByStudentId(student.getId());
        List<Klass> joinedClasses = klassRepo.findAllActive().stream()
                .filter(k -> joinedClassIds.contains(k.getId()))
                .toList();

        List<Assignment> classAssignments = assignmentRepo.findByClassIdIn(joinedClassIds);
        List<Assignment> openAssignments = classAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED)
                .toList();

        List<Submission> mySubmissions = submissionRepo.findByStudentId(student.getId());
        List<Grade> myGrades = gradeRepo.findByStudentId(student.getId());

        Instant dueSoonThreshold = Instant.now().plus(48, ChronoUnit.HOURS);
        long dueSoon = openAssignments.stream()
                .filter(a -> a.getDueAt() != null && a.getDueAt().isAfter(Instant.now()) && a.getDueAt().isBefore(dueSoonThreshold))
                .count();

        long graded = mySubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).count();
        long resubmit = mySubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED).count();

        List<StudentDashboardResponse.UpcomingAssignment> upcoming = openAssignments.stream()
                .sorted(Comparator.comparing(Assignment::getDueAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(5)
                .map(a -> {
                    Klass k = klassRepo.findActiveById(a.getClassId()).orElse(null);
                    return new StudentDashboardResponse.UpcomingAssignment(a.getId(), a.getTitle(), a.getClassId(), k != null ? k.getName() : "", a.getDueAt(), a.getStatus().name());
                })
                .toList();

        List<StudentDashboardResponse.RecentMaterial> recentMats = materialRepo.findAllActive().stream()
                .filter(m -> joinedClassIds.contains(m.getClassId()) && m.isVisible())
                .sorted(Comparator.comparing(Material::getCreatedAt).reversed())
                .limit(4)
                .map(m -> {
                    Klass k = klassRepo.findActiveById(m.getClassId()).orElse(null);
                    return new StudentDashboardResponse.RecentMaterial(m.getId(), m.getTitle(), m.getClassId(), k != null ? k.getName() : "", m.getCreatedAt());
                })
                .toList();

        List<StudentDashboardResponse.NotificationSummary> notifs = notificationRepo.findAllActive().stream()
                .filter(n -> n.getTargetType() == TargetType.ALL || (n.getTargetType() == TargetType.CLASS && joinedClassIds.contains(n.getTargetId())))
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(5)
                .map(n -> new StudentDashboardResponse.NotificationSummary(n.getId(), n.getTitle(), n.getTargetType().name(), n.getCreatedAt()))
                .toList();

        BigDecimal avgScore = myGrades.isEmpty() ? BigDecimal.ZERO :
                myGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(myGrades.size()), 2, RoundingMode.HALF_UP);
        long onTime = mySubmissions.stream().filter(s -> s.getStatus() != SubmissionStatus.LATE).count();
        long late = mySubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();

        StudentDashboardResponse.LatestFeedback latestFeedback = myGrades.stream()
                .max(Comparator.comparing(Grade::getGradedAt))
                .map(g -> {
                    Submission submission = mySubmissions.stream()
                            .filter(s -> s.getId().equals(g.getSubmissionId()))
                            .findFirst()
                            .orElse(null);
                    Assignment assignment = submission == null ? null : assignmentRepo.findActiveById(submission.getAssignmentId()).orElse(null);
                    return new StudentDashboardResponse.LatestFeedback(
                            g.getSubmissionId(),
                            assignment != null ? assignment.getId() : null,
                            assignment != null ? assignment.getTitle() : "Bài tập gần nhất",
                            g.getScore(),
                            g.getFeedback(),
                            g.getGradedAt()
                    );
                })
                .orElse(null);

        StudentDashboardResponse.SubmissionStats stats = new StudentDashboardResponse.SubmissionStats(mySubmissions.size(), (int) onTime, (int) late, avgScore);

        // Recent Activity
        List<ActivityResponse> recentActivity = activityService.recentForCurrentUser();
        List<TeacherDashboardResponse.RecentActivity> mappedRecentActivity = recentActivity.stream()
                .map(log -> new TeacherDashboardResponse.RecentActivity(
                        log.id().toString(),
                        log.actionType(),
                        log.message(),
                        log.actorName(),
                        log.targetName() != null ? log.targetName() : "",
                        log.createdAt(),
                        "#"
                ))
                .toList();

        return new StudentDashboardResponse(joinedClasses.size(), openAssignments.size(), (int) dueSoon, mySubmissions.size(), (int) graded, (int) resubmit, latestFeedback, upcoming, recentMats, notifs, stats, mappedRecentActivity);
    }
}
