package com.hoanobita.topikplatform.grading.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GradeResponse(UUID id, UUID submissionId, BigDecimal score, String feedback, UUID gradedBy, Instant gradedAt) {}
