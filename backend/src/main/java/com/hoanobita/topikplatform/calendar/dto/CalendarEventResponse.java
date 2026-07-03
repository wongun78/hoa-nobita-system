package com.hoanobita.topikplatform.calendar.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CalendarEventResponse(
        String type,
        UUID id,
        String title,
        LocalDate date,
        Instant dueAt,
        UUID classId,
        String className
) {}
