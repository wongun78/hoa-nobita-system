package com.hoanobita.topikplatform.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.hoanobita.topikplatform.dashboard.dto.TeacherDashboardResponse.RecentActivity;

public record AdminDashboardResponse(
        int assignedClassCount,
        int todayNeedGradingCount,
        int dueSoonAssignmentCount,
        int missingSubmissionCount,
        KpiSection kpi,
        ChartsSection charts,
        List<TodayTask> todayTasks,
        List<RecentActivity> recentActivity
) {
    public record KpiSection(
            ClassKpi classes,
            StudentKpi students,
            AssignmentKpi assignments,
            SubmissionKpi submissions,
            ScoreKpi scores
    ) {}

    public record ClassKpi(int assignedTotal, int active) {}
    public record StudentKpi(int totalInAssignedClasses, int active, int suspended) {}
    public record AssignmentKpi(int published, int closed, int dueSoon48h, int overdue) {}
    public record SubmissionKpi(int submitted, int missing, int needGrading, int late) {}
    public record ScoreKpi(BigDecimal averageScore, int belowThresholdStudentCount) {}

    public record ChartsSection(
            List<SubmissionRateByClass> submissionRateByAssignedClass,
            List<NeedGradingByClass> needGradingByAssignedClass,
            List<AverageScoreByClass> averageScoreByAssignedClass,
            List<StatusCount> activeSuspendedStudentRatio,
            List<StatusCount> assignmentStatusInAssignedClasses
    ) {}

    public record StatusCount(String status, long count) {}
    public record SubmissionRateByClass(UUID classId, String className, long submitted, long missing, long late) {}
    public record NeedGradingByClass(UUID classId, String className, long count) {}
    public record AverageScoreByClass(UUID classId, String className, BigDecimal averageScore) {}

    public record TodayTask(String id, String type, String title, String description, String priority, String targetUrl, String ctaLabel) {}
}