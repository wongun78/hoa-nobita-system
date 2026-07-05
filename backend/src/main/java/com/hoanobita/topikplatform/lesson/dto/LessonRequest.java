package com.hoanobita.topikplatform.lesson.dto;

public record LessonRequest(
        String title,
        String description,
        String lessonDate,
        Integer orderIndex,
        String status
) {}
