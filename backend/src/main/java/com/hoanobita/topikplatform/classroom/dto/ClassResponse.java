package com.hoanobita.topikplatform.classroom.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ClassResponse(
        UUID id,
        String name,
        String code,
        String description,
        Integer levelFrom,
        Integer levelTo,
        String status,
        UUID teacherId,
        String teacherName,
        LocalDate startDate,
        LocalDate endDate,
        int studentCount,
        List<AdminInfo> admins,
        Instant createdAt
) {
    public record AdminInfo(UUID id, String fullName) {}
}
