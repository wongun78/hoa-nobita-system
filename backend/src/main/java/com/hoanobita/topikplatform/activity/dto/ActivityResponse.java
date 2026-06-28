package com.hoanobita.topikplatform.activity.dto;

import java.time.Instant;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        String actionType,
        String targetType,
        UUID targetId,
        String targetName,
        UUID actorId,
        String actorName,
        UUID classId,
        String message,
        Instant createdAt
) {}
