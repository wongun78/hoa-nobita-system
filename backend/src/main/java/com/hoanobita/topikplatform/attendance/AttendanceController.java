package com.hoanobita.topikplatform.attendance;

import com.hoanobita.topikplatform.attendance.dto.AttendanceBulkRequest;
import com.hoanobita.topikplatform.attendance.dto.AttendanceResponse;
import com.hoanobita.topikplatform.attendance.dto.AttendanceSummaryResponse;
import com.hoanobita.topikplatform.attendance.dto.AttendanceUpdateRequest;
import com.hoanobita.topikplatform.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private final AttendanceService service;

    public AttendanceController(AttendanceService service) {
        this.service = service;
    }

    @GetMapping("/classes/{classId}/attendance/summary")
    public ApiResponse<AttendanceSummaryResponse> summary(@PathVariable UUID classId) {
        return ApiResponse.ok(service.summary(classId));
    }

    @PostMapping("/lessons/{lessonId}/attendance")
    public ApiResponse<List<AttendanceResponse>> markLessonAttendance(@PathVariable UUID lessonId,
                                                                      @RequestBody AttendanceBulkRequest request) {
        return ApiResponse.ok(service.markLessonAttendance(lessonId, request));
    }

    @GetMapping("/lessons/{lessonId}/attendance")
    public ApiResponse<List<AttendanceResponse>> lessonAttendance(@PathVariable UUID lessonId) {
        return ApiResponse.ok(service.lessonAttendance(lessonId));
    }

    @GetMapping("/students/{studentId}/attendance")
    public ApiResponse<List<AttendanceResponse>> studentAttendance(@PathVariable UUID studentId) {
        return ApiResponse.ok(service.studentAttendance(studentId));
    }

    @PatchMapping("/attendance/{attendanceId}")
    public ApiResponse<AttendanceResponse> update(@PathVariable UUID attendanceId,
                                                  @RequestBody AttendanceUpdateRequest request) {
        return ApiResponse.ok(service.update(attendanceId, request));
    }
}
