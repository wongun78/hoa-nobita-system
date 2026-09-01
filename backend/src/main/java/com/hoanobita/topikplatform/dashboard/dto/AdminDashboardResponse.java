package com.hoanobita.topikplatform.dashboard.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminDashboardResponse(
        int dueSoonAssignmentCount,
        int missingSubmissionCount,
        List<AssignmentDueSoon> assignmentsDueSoon
) {
    public record AssignmentDueSoon(UUID assignmentId, String title, UUID classId, String className, Instant deadline) {}
}