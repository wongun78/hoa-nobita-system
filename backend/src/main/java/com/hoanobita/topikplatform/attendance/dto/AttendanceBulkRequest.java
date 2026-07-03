package com.hoanobita.topikplatform.attendance.dto;

import java.util.List;

public record AttendanceBulkRequest(
        List<AttendanceRecordRequest> records
) {}
