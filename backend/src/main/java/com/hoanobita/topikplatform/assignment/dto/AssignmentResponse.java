package com.hoanobita.topikplatform.assignment.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AssignmentResponse(
        UUID id,
        UUID classId,
        String className,
        UUID lessonId,
        String title,
        String description,
        String instruction,
        Instant dueAt,
        BigDecimal maxScore,
        String status,
        boolean allowResubmit,
        String skill,
        UUID fileId,
        String externalLink,
        Instant createdAt
) {}
