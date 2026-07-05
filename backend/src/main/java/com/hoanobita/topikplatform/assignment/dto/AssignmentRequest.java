package com.hoanobita.topikplatform.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AssignmentRequest(
        @NotBlank(message = "Tiêu đề là bắt buộc")
        String title,
        String description,
        String instruction,
        String dueAt,
        @Positive(message = "Max score must be positive")
        BigDecimal maxScore,
        String status,
        Boolean allowResubmit,
        String skill,
        UUID fileId,
        List<UUID> fileIds,
        String externalLink
) {}
