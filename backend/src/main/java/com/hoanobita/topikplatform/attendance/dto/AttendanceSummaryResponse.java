package com.hoanobita.topikplatform.attendance.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AttendanceSummaryResponse(
        UUID classId,
        int totalLessons,
        BigDecimal attendanceRate,
        List<StudentAttendanceSummaryResponse> studentAttendance
) {}
