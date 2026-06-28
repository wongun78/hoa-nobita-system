package com.hoanobita.topikplatform.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TeacherDashboardResponse(
        LocalDate currentDate,
        String greetingName,
        int todayActionCount,
        int activeClassCount,
        int activeStudentCount,
        int needGradingCount,
        int overdueMissingSubmissionCount,
        KpiSection kpi,
        ChartsSection charts,
        List<TodayTask> todayTasks,
        List<ClassHealth> classHealth,
        List<AssignmentDueSoon> assignmentsDueSoon,
        List<RiskStudent> riskStudents,
        List<RecentActivity> recentActivity
) {
    public record KpiSection(
            ClassKpi classes,
            StudentKpi students,
            AssignmentKpi assignments,
            SubmissionKpi submissions,
            GradingKpi grading,
            MaterialKpi materials,
            NotificationKpi notifications
    ) {}

    public record ClassKpi(int total, int active, int completed, int draft, int archived, int upcoming) {}
    public record StudentKpi(int total, int active, int suspended, int inactive, int newLast7Days, int newLast30Days, int unassigned) {}
    public record AssignmentKpi(int total, int draft, int published, int closed, int dueSoon48h, int overdue) {}
    public record SubmissionKpi(int submitted, int missing, int late, int needGrading, int graded, int resubmitRequested) {}
    public record GradingKpi(int waiting, BigDecimal averageScore, BigDecimal passRate, BigDecimal improvementRate) {}
    public record MaterialKpi(int total, int visible, int hidden, int newRecently) {}
    public record NotificationKpi(int sentLast7Days, int globalCount, int classCount) {}

    public record ChartsSection(
            List<StatusCount> classStatusChart,
            List<SubmissionRateByClass> submissionRateByClass,
            List<NeedGradingByClass> needGradingByClass,
            List<AverageScoreByClass> averageScoreByClass,
            List<GradeDistribution> gradeDistribution,
            List<StatusCount> assignmentWorkflow
    ) {}

    public record StatusCount(String status, long count) {}
    public record SubmissionRateByClass(UUID classId, String className, long submitted, long missing, long late) {}
    public record NeedGradingByClass(UUID classId, String className, long count) {}
    public record AverageScoreByClass(UUID classId, String className, BigDecimal averageScore, BigDecimal maxScoreAverage) {}
    public record GradeDistribution(String range, long count) {}

    public record TodayTask(String id, String type, String title, String description, String priority, String targetUrl, String ctaLabel) {}
    public record ClassHealth(UUID classId, String className, int studentCount, List<String> adminNames, int openAssignmentCount, BigDecimal submissionRate, int needGradingCount, BigDecimal averageScore, String status, List<String> issues, String actionUrl) {}
    public record AssignmentDueSoon(UUID assignmentId, String title, UUID classId, String className, java.time.Instant deadline, String status, long submittedCount, int totalStudents, long lateCount, int needGradingCount, String actionUrl) {}
    public record RiskStudent(UUID studentId, String fullName, String email, String phone, UUID classId, String className, BigDecimal submissionRate, BigDecimal averageScore, String issue, String riskLevel, String actionUrl) {}
    public record RecentActivity(String id, String type, String message, String actorName, String targetName, java.time.Instant createdAt, String targetUrl) {}
}