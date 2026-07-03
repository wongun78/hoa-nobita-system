package com.hoanobita.topikplatform.attendance.dto;

public record AttendanceUpdateRequest(
        String status,
        String note
) {}
