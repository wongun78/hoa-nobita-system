package com.hoanobita.topikplatform.submission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SubmissionResponse(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        String contentText,
        String contentUrl,
        UUID fileId,
        String status,
        Instant submittedAt,
        BigDecimal score,
        String feedback
) {}
