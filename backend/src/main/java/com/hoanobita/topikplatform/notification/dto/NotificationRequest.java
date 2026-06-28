package com.hoanobita.topikplatform.notification.dto;

import com.hoanobita.topikplatform.common.Enums.TargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record NotificationRequest(
        @NotBlank String title,
        @NotBlank String content,
        @NotNull TargetType targetType,
        UUID targetId
) {}
