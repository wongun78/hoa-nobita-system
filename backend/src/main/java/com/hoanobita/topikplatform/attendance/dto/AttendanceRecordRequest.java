package com.hoanobita.topikplatform.attendance.dto;

import java.util.UUID;

public record AttendanceRecordRequest(
        UUID studentId,
        String status,
        String note
) {}
