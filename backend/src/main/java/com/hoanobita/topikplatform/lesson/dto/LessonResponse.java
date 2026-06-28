package com.hoanobita.topikplatform.lesson.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LessonResponse(
        UUID id,
        UUID classId,
        String title,
        String description,
        LocalDate lessonDate,
        int orderIndex,
        String status,
        Instant createdAt
) {}
