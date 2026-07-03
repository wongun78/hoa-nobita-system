package com.hoanobita.topikplatform.assignment.dto;

import java.util.List;
import java.util.UUID;

public record BatchAssignmentReminderRequest(
        List<UUID> assignmentIds,
        String title,
        String content
) {
}