package com.hoanobita.topikplatform.lesson.dto;

import jakarta.validation.constraints.NotBlank;

public record LessonRequest(
        @NotBlank(message = "Lesson title is required") String title,
        String description,
        String lessonDate,
        Integer orderIndex,
        String status
) {}
