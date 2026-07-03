package com.hoanobita.topikplatform.grading.dto;

import java.util.List;
import java.util.UUID;

public record BulkGradeResponse(
        int gradedCount,
        int failedCount,
        List<BulkGradeError> errors
) {
    public record BulkGradeError(UUID submissionId, String message) {}
}
