package com.hoanobita.topikplatform.material.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record MaterialRequest(
        @NotBlank(message = "Title is required")
        String title,
        String description,
        String externalUrl,
        UUID fileId,
        Boolean visible
) {}
