package com.hoanobita.topikplatform.attendance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StudentAttendanceSummaryResponse(
        UUID studentId,
        String studentName,
        String studentEmail,
        int presentCount,
        int absentCount,
        int lateCount,
        BigDecimal attendanceRate
) {}
