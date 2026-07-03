package com.hoanobita.topikplatform.assignment.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AssignmentReminderPreviewResponse(
        UUID assignmentId,
        String assignmentTitle,
        UUID classId,
        String className,
        Instant deadline,
        int totalStudents,
        int submittedCount,
        int missingCount,
        List<MissingStudentResponse> missingStudents
) {
}