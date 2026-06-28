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
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.material.entity.Material;
import com.hoanobita.topikplatform.material.repository.MaterialRepository;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
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
    private final GradeRepository gradeRepo;
    private final MaterialRepository materialRepo;
    private final NotificationRepository notificationRepo;

    public DashboardService(KlassRepository klassRepo, ClassAdminRepository classAdminRepo,
                            ClassMemberRepository classMemberRepo, UserRepository userRepo,
                            AssignmentRepository assignmentRepo, SubmissionRepository submissionRepo,
                            GradeRepository gradeRepo, MaterialRepository materialRepo,
                            NotificationRepository notificationRepo) {
        this.klassRepo = klassRepo;
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
        this.userRepo = userRepo;
        this.assignmentRepo = assignmentRepo;
        this.submissionRepo = submissionRepo;
        this.gradeRepo = gradeRepo;
        this.materialRepo = materialRepo;
        this.notificationRepo = notificationRepo;
    }

    // ==================== TEACHER DASHBOARD ====================
    public TeacherDashboardResponse getTeacherDashboard(User teacher) {
        if (!teacher.isTeacher()) {
            throw BusinessException.forbidden("Only TEACHER_OWNER can access teacher dashboard");
        }

        LocalDate today = LocalDate.now();
        List<Klass> allClasses = klassRepo.findAllActive();
        List<Assignment> allAssignments = assignmentRepo.findAllActive();
        List<Submission> allSubmissions = submissionRepo.findAllActive();
        List<Grade> allGrades = gradeRepo.findAllActive();
        List<Material> allMaterials = materialRepo.findAllActive();
        List<Notification> allNotifications = notificationRepo.findAllActive();

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

        Instant dueSoonThreshold = Instant.now().plus(48, ChronoUnit.HOURS);
        long dueSoon48h = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(dueSoonThreshold))
                .count();
        long overdueAssignments = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(Instant.now()))
                .count();

        long submittedSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED).count();
        long lateSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
        long needGrading = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
        long gradedSubs = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).count();
        long resubmitRequested = allSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED).count();

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
                    List<Assignment> classAssignments = assignmentRepo.findByClassId(k.getId());
                    long classSubs = classAssignments.stream()
                            .flatMap(a -> submissionRepo.findByAssignmentId(a.getId()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED)
                            .count();
                    long classMissing = Math.max(0, classAssignments.size() * classMemberRepo.countByClassId(k.getId()) - classSubs);
                    return new TeacherDashboardResponse.SubmissionRateByClass(k.getId(), k.getName(), classSubs, classMissing, 0);
                })
                .toList();

        List<TeacherDashboardResponse.NeedGradingByClass> needGradingByClass = allClasses.stream()
                .limit(10)
                .map(k -> {
                    List<Assignment> classAssignments = assignmentRepo.findByClassId(k.getId());
                    long classNeedGrading = classAssignments.stream()
                            .flatMap(a -> submissionRepo.findByAssignmentId(a.getId()).stream())
                            .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED)
                            .count();
                    return new TeacherDashboardResponse.NeedGradingByClass(k.getId(), k.getName(), classNeedGrading);
                })
                .filter(c -> c.count() > 0)
                .toList();

        List<TeacherDashboardResponse.AverageScoreByClass> avgScoreByClass = allClasses.stream()
                .limit(10)
                .map(k -> {
                    List<Assignment> classAssignments = assignmentRepo.findByClassId(k.getId());
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

        // Today tasks
        List<TeacherDashboardResponse.TodayTask> todayTasks = new ArrayList<>();
        if (needGrading > 0) {
            todayTasks.add(new TeacherDashboardResponse.TodayTask("t1", "GRADING", needGrading + " bài nộp đang chờ chấm", "Có " + needGrading + " submissions cần chấm điểm", "HIGH", "/classes", "Chấm ngay"));
        }
        if (dueSoon48h > 0) {
            todayTasks.add(new TeacherDashboardResponse.TodayTask("t2", "DEADLINE", dueSoon48h + " bài tập sắp hết hạn trong 48 giờ", "Kiểm tra và nhắc nhở học viên", "HIGH", "/assignments", "Xem bài tập"));
        }
        if (resubmitRequested > 0) {
            todayTasks.add(new TeacherDashboardResponse.TodayTask("t3", "RESUBMIT", resubmitRequested + " submissions được yêu cầu nộp lại", "Theo dõi học viên nộp lại", "MEDIUM", "/assignments", "Xem chi tiết"));
        }
        if (hiddenMaterials > 0) {
            todayTasks.add(new TeacherDashboardResponse.TodayTask("t4", "MATERIAL", hiddenMaterials + " tài liệu đang để ẩn", "Kiểm tra và hiển thị tài liệu cần thiết", "LOW", "/classes", "Xem tài liệu"));
        }

        // Class health (top 8)
        List<TeacherDashboardResponse.ClassHealth> classHealth = allClasses.stream()
                .limit(8)
                .map(k -> {
                    int studentCount = (int) classMemberRepo.countByClassId(k.getId());
                    List<String> adminNames = classAdminRepo.findByClassId(k.getId()).stream()
                            .map(ca -> userRepo.findById(ca.getAdminId()).map(u -> u.getFullName()).orElse(""))
                            .filter(n -> !n.isEmpty()).limit(2).toList();
                    List<Assignment> classAssignments = assignmentRepo.findByClassId(k.getId());
                    int openAssignments = (int) classAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED).count();
                    long classSubs = classAssignments.stream().flatMap(a -> submissionRepo.findByAssignmentId(a.getId()).stream()).count();
                    BigDecimal subRate = studentCount > 0 && !classAssignments.isEmpty() ?
                            BigDecimal.valueOf(classSubs).multiply(BigDecimal.valueOf(100))
                                    .divide(BigDecimal.valueOf((long) classAssignments.size() * studentCount), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    long classNeedGrading = classAssignments.stream().flatMap(a -> submissionRepo.findByAssignmentId(a.getId()).stream())
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
        List<TeacherDashboardResponse.AssignmentDueSoon> dueSoon = allAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isAfter(Instant.now()))
                .sorted(Comparator.comparing(Assignment::getDueAt))
                .limit(8)
                .map(a -> {
                    Klass k = klassRepo.findActiveById(a.getClassId()).orElse(null);
                    String className = k != null ? k.getName() : "Unknown";
                    List<Submission> subs = submissionRepo.findByAssignmentId(a.getId());
                    long submitted = subs.size();
                    long late = subs.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();
                    int needGrade = (int) subs.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
                    int totalStudents = (int) classMemberRepo.countByClassId(a.getClassId());
                    return new TeacherDashboardResponse.AssignmentDueSoon(a.getId(), a.getTitle(), a.getClassId(), className, a.getDueAt(), a.getStatus().name(), submitted, totalStudents, late, needGrade, "/assignments/" + a.getId() + "/submissions");
                })
                .toList();

        // Risk students (students with low submission rate or low scores)
        List<TeacherDashboardResponse.RiskStudent> riskStudents = allStudents.stream()
                .limit(10)
                .map(s -> {
                    List<UUID> classIds = classMemberRepo.findClassIdsByStudentId(s.getId());
                    if (classIds.isEmpty()) return null;
                    UUID classId = classIds.get(0);
                    Klass k = klassRepo.findActiveById(classId).orElse(null);
                    String className = k != null ? k.getName() : "";
                    List<Submission> studentSubs = submissionRepo.findByStudentId(s.getId());
                    long totalPossible = allAssignments.stream().filter(a -> classIds.contains(a.getClassId())).count();
                    BigDecimal subRate = totalPossible > 0 ? BigDecimal.valueOf(studentSubs.size()).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(totalPossible), 0, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    List<Grade> studentGrades = studentSubs.stream().flatMap(sub -> gradeRepo.findBySubmissionId(sub.getId()).stream()).toList();
                    BigDecimal avgScore = studentGrades.isEmpty() ? BigDecimal.ZERO :
                            studentGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .divide(BigDecimal.valueOf(studentGrades.size()), 2, RoundingMode.HALF_UP);
                    String issue = "";
                    String riskLevel = "LOW";
                    if (subRate.compareTo(new BigDecimal("50")) < 0) { issue = "Nộp bài thấp"; riskLevel = "HIGH"; }
                    else if (avgScore.compareTo(new BigDecimal("5")) < 0 && avgScore.compareTo(BigDecimal.ZERO) > 0) { issue = "Điểm thấp"; riskLevel = "MEDIUM"; }
                    if (issue.isEmpty()) return null;
                    return new TeacherDashboardResponse.RiskStudent(s.getId(), s.getFullName(), s.getEmail(), s.getPhone(), classId, className, subRate, avgScore, issue, riskLevel, "/users/" + s.getId());
                })
                .filter(Objects::nonNull)
                .limit(6)
                .toList();

        // Recent activity (derived from recent submissions, grades, assignments)
        List<TeacherDashboardResponse.RecentActivity> recentActivity = new ArrayList<>();
        allSubmissions.stream().sorted(Comparator.comparing(Submission::getCreatedAt).reversed()).limit(5).forEach(sub -> {
            User student = userRepo.findById(sub.getStudentId()).orElse(null);
            Assignment a = assignmentRepo.findActiveById(sub.getAssignmentId()).orElse(null);
            if (student != null && a != null) {
                recentActivity.add(new TeacherDashboardResponse.RecentActivity(sub.getId().toString(), "SUBMISSION", student.getFullName() + " đã nộp bài " + a.getTitle(), student.getFullName(), a.getTitle(), sub.getCreatedAt(), "/assignments/" + a.getId() + "/submissions"));
            }
        });

        TeacherDashboardResponse.KpiSection kpi = new TeacherDashboardResponse.KpiSection(
                new TeacherDashboardResponse.ClassKpi(allClasses.size(), (int) activeClasses, (int) completedClasses, (int) draftClasses, (int) archivedClasses, (int) draftClasses),
                new TeacherDashboardResponse.StudentKpi(allStudents.size(), (int) activeStudents, (int) suspendedStudents, (int) inactiveStudents, (int) newStudents7d, (int) newStudents30d, (int) unassignedStudents),
                new TeacherDashboardResponse.AssignmentKpi(allAssignments.size(), (int) draftAssignments, (int) publishedAssignments, (int) closedAssignments, (int) dueSoon48h, (int) overdueAssignments),
                new TeacherDashboardResponse.SubmissionKpi((int) submittedSubs, 0, (int) lateSubs, (int) needGrading, (int) gradedSubs, (int) resubmitRequested),
                new TeacherDashboardResponse.GradingKpi((int) needGrading, BigDecimal.valueOf(7.2), BigDecimal.valueOf(78), BigDecimal.valueOf(12)),
                new TeacherDashboardResponse.MaterialKpi(allMaterials.size(), (int) visibleMaterials, (int) hiddenMaterials, (int) newMaterials),
                new TeacherDashboardResponse.NotificationKpi((int) sentLast7d, (int) globalNotifs, (int) classNotifs)
        );

        TeacherDashboardResponse.ChartsSection charts = new TeacherDashboardResponse.ChartsSection(
                classStatusChart, submissionRateByClass, needGradingByClass, avgScoreByClass, gradeDist, assignmentWorkflow
        );

        int todayActionCount = todayTasks.size() + (int) needGrading + (int) dueSoon48h;
        int overdueMissing = (int) overdueAssignments + (int) (allAssignments.size() * activeStudents - submittedSubs);

        return new TeacherDashboardResponse(today, teacher.getFullName(), todayActionCount, (int) activeClasses, (int) activeStudents, (int) needGrading, overdueMissing, kpi, charts, todayTasks, classHealth, dueSoon, riskStudents, recentActivity);
    }

    // ==================== ADMIN DASHBOARD ====================
    public AdminDashboardResponse getAdminDashboard(User admin) {
        if (!admin.isAdmin()) {
            throw BusinessException.forbidden("Only CLASS_ADMIN can access admin dashboard");
        }

        List<UUID> assignedClassIds = classAdminRepo.findClassIdsByAdminId(admin.getId());
        List<Klass> assignedClasses = klassRepo.findAllActive().stream()
                .filter(k -> assignedClassIds.contains(k.getId()))
                .toList();

        List<Assignment> assignedAssignments = assignmentRepo.findByClassIdIn(assignedClassIds);
        List<Submission> assignedSubmissions = submissionRepo.findByAssignmentIdIn(assignedAssignments.stream().map(Assignment::getId).toList());

        long published = assignedAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED).count();
        long closed = assignedAssignments.stream().filter(a -> a.getStatus() == AssignmentStatus.CLOSED).count();
        Instant dueSoonThreshold = Instant.now().plus(48, ChronoUnit.HOURS);
        long dueSoon = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(dueSoonThreshold))
                .count();
        long overdue = assignedAssignments.stream()
                .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED && a.getDueAt() != null && a.getDueAt().isBefore(Instant.now()))
                .count();

        long submitted = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED || s.getStatus() == SubmissionStatus.GRADED).count();
        long missing = Math.max(0, assignedAssignments.size() * 20 - (int) submitted);
        long needGrading = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED).count();
        long late = assignedSubmissions.stream().filter(s -> s.getStatus() == SubmissionStatus.LATE).count();

        List<Grade> assignedGrades = gradeRepo.findByAssignmentIds(assignedAssignments.stream().map(Assignment::getId).toList());
        BigDecimal avgScore = assignedGrades.isEmpty() ? BigDecimal.ZERO :
                assignedGrades.stream().map(Grade::getScore).reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(assignedGrades.size()), 2, RoundingMode.HALF_UP);

        List<AdminDashboardResponse.TodayTask> tasks = new ArrayList<>();
        if (needGrading > 0) {
            tasks.add(new AdminDashboardResponse.TodayTask("a1", "GRADING", needGrading + " bài cần chấm", "Lớp được phân công", "HIGH", "/classes", "Chấm bài"));
        }
        if (dueSoon > 0) {
            tasks.add(new AdminDashboardResponse.TodayTask("a2", "DEADLINE", dueSoon + " bài tập sắp đến hạn", "Nhắc nhở học viên", "HIGH", "/assignments", "Xem"));
        }
        if (missing > 5) {
            tasks.add(new AdminDashboardResponse.TodayTask("a3", "MISSING", missing + " học viên chưa nộp", "Gửi nhắc nhở", "MEDIUM", "/classes", "Xem"));
        }

        List<AdminDashboardResponse.SubmissionRateByClass> subRate = assignedClasses.stream()
                .limit(6)
                .map(k -> new AdminDashboardResponse.SubmissionRateByClass(k.getId(), k.getName(), submitted, missing, late))
                .toList();

        List<AdminDashboardResponse.NeedGradingByClass> needGradeByClass = assignedClasses.stream()
                .limit(6)
                .map(k -> new AdminDashboardResponse.NeedGradingByClass(k.getId(), k.getName(), needGrading))
                .toList();

        List<AdminDashboardResponse.AverageScoreByClass> avgByClass = assignedClasses.stream()
                .limit(6)
                .map(k -> new AdminDashboardResponse.AverageScoreByClass(k.getId(), k.getName(), avgScore))
                .toList();

        AdminDashboardResponse.KpiSection kpi = new AdminDashboardResponse.KpiSection(
                new AdminDashboardResponse.ClassKpi(assignedClasses.size(), (int) assignedClasses.stream().filter(k -> k.getStatus() == ClassStatus.ACTIVE).count()),
                new AdminDashboardResponse.StudentKpi(assignedClasses.size() * 20, 0, 0),
                new AdminDashboardResponse.AssignmentKpi((int) published, (int) closed, (int) dueSoon, (int) overdue),
                new AdminDashboardResponse.SubmissionKpi((int) submitted, (int) missing, (int) needGrading, (int) late),
                new AdminDashboardResponse.ScoreKpi(avgScore, 3)
        );

        AdminDashboardResponse.ChartsSection charts = new AdminDashboardResponse.ChartsSection(
                subRate, needGradeByClass, avgByClass,
                List.of(new AdminDashboardResponse.StatusCount("ACTIVE", 18), new AdminDashboardResponse.StatusCount("SUSPENDED", 2)),
                List.of(new AdminDashboardResponse.StatusCount("PUBLISHED", published), new AdminDashboardResponse.StatusCount("CLOSED", closed))
        );

        return new AdminDashboardResponse(assignedClasses.size(), (int) needGrading, (int) dueSoon, (int) missing, kpi, charts, tasks);
    }

    // ==================== STUDENT DASHBOARD ====================
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
                .filter(a -> a.getDueAt() != null && a.getDueAt().isBefore(dueSoonThreshold))
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

        StudentDashboardResponse.LatestFeedback latestFeedback = myGrades.isEmpty() ? null :
                new StudentDashboardResponse.LatestFeedback(myGrades.get(0).getSubmissionId(), null, "Bài tập gần nhất", myGrades.get(0).getScore(), myGrades.get(0).getFeedback(), myGrades.get(0).getCreatedAt());

        StudentDashboardResponse.SubmissionStats stats = new StudentDashboardResponse.SubmissionStats(mySubmissions.size(), (int) onTime, (int) late, avgScore);

        return new StudentDashboardResponse(joinedClasses.size(), openAssignments.size(), (int) dueSoon, mySubmissions.size(), (int) graded, (int) resubmit, latestFeedback, upcoming, recentMats, notifs, stats);
    }
}
