package com.hoanobita.topikplatform.material.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record MaterialRequest(
        @NotBlank(message = "Tiêu đề là bắt buộc")
        String title,
        String description,
        String externalUrl,
        UUID fileId,
        Boolean visible
) {}
