package com.hoanobita.topikplatform.dashboard.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StudentDashboardResponse(
        int joinedClassCount,
        int openAssignmentCount,
        int dueSoonCount,
        int submittedCount,
        int gradedCount,
        int resubmitRequestedCount,
        LatestFeedback latestFeedback,
        List<UpcomingAssignment> upcomingAssignments,
        List<RecentMaterial> recentMaterials,
        List<NotificationSummary> notifications,
        SubmissionStats ownSubmissionStats
) {
    public record LatestFeedback(UUID submissionId, UUID assignmentId, String assignmentTitle, BigDecimal score, String feedback, Instant gradedAt) {}
    public record UpcomingAssignment(UUID assignmentId, String title, UUID classId, String className, Instant deadline, String status) {}
    public record RecentMaterial(UUID materialId, String title, UUID classId, String className, Instant createdAt) {}
    public record NotificationSummary(UUID id, String title, String targetType, Instant createdAt) {}
    public record SubmissionStats(int total, int onTime, int late, BigDecimal averageScore) {}
}