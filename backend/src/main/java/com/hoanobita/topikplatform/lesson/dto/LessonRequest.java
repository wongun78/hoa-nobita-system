package com.hoanobita.topikplatform.lesson.dto;

import jakarta.validation.constraints.NotBlank;

public record LessonRequest(
        @NotBlank(message = "Title is required")
        String title,
        String description,
        String lessonDate,
        Integer orderIndex,
        String status
) {}
