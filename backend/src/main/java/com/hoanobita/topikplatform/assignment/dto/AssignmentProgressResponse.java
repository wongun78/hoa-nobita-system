package com.hoanobita.topikplatform.assignment.dto;

import java.util.UUID;

public record AssignmentProgressResponse(
        UUID assignmentId,
        int totalStudents,
        int submittedCount,
        int missingCount,
        int lateCount,
        int gradedCount,
        int needGradingCount
) {}
