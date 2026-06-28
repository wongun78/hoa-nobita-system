package com.hoanobita.topikplatform.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record AssignmentRequest(
        @NotBlank(message = "Title is required")
        String title,
        String description,
        String instruction,
        String dueAt,
        @Positive(message = "Max score must be positive")
        BigDecimal maxScore,
        String status,
        Boolean allowResubmit
) {}
