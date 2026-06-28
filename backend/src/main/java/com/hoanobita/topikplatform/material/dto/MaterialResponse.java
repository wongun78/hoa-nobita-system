package com.hoanobita.topikplatform.material.dto;

import java.time.Instant;
import java.util.UUID;

public record MaterialResponse(
        UUID id,
        UUID classId,
        UUID lessonId,
        UUID fileId,
        String title,
        String description,
        String externalUrl,
        boolean visible,
        Instant createdAt
) {}
