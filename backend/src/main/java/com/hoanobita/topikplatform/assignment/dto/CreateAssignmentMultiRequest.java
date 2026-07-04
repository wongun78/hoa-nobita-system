package com.hoanobita.topikplatform.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateAssignmentMultiRequest(
        @NotEmpty(message = "classIds is required")
        List<UUID> classIds,
        @NotBlank(message = "Title is required")
        String title,
        String description,
        String instruction,
        String dueAt,
        @Positive(message = "Max score must be positive")
        BigDecimal maxScore,
        Boolean allowResubmit,
        String skill,
        UUID fileId,
        String externalLink
) {}
