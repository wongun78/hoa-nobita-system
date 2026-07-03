package com.hoanobita.topikplatform.assignment.dto;

import java.time.Instant;
import java.util.UUID;

public record AssignmentReminderDispatchResponse(
        UUID notificationId,
        UUID assignmentId,
        int recipientCount,
        String title,
        String content,
        Instant createdAt
) {
}