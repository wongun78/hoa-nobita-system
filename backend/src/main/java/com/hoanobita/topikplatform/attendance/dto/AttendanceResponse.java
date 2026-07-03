package com.hoanobita.topikplatform.attendance.dto;

import java.time.Instant;
import java.util.UUID;

public record AttendanceResponse(
        UUID id,
        UUID lessonId,
        String lessonTitle,
        UUID classId,
        String className,
        UUID studentId,
        String studentName,
        String studentEmail,
        String status,
        String note,
        UUID createdBy,
        Instant createdAt
) {}
