package com.hoanobita.topikplatform.grading.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BulkGradeItemRequest(
        UUID submissionId,
        BigDecimal score,
        String feedback,
        UUID feedbackFileId,
        String feedbackLink
) {}
