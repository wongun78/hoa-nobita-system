package com.hoanobita.topikplatform.assignment.dto;

import java.util.List;

public record BatchAssignmentReminderDispatchResponse(
        int assignmentCount,
        int totalRecipients,
        List<AssignmentReminderDispatchResponse> dispatches
) {
}