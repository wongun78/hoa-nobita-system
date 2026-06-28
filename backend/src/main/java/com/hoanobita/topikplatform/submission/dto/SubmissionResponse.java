package com.hoanobita.topikplatform.submission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SubmissionResponse(
        UUID id,
        UUID assignmentId,
        String assignmentTitle,
        String className,
        UUID studentId,
        String studentName,
        String contentText,
        String contentUrl,
        UUID fileId,
        String status,
        Instant submittedAt,
        BigDecimal score,
        BigDecimal maxScore,
        String feedback
) {}
