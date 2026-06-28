package com.hoanobita.topikplatform.controller.report;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.dto.report.ClassReportResponse;
import com.hoanobita.topikplatform.dto.report.SystemReportResponse;
import com.hoanobita.topikplatform.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/system")
    @PreAuthorize("hasRole('TEACHER_OWNER')")
    public ApiResponse<SystemReportResponse> getSystemReport() {
        return ApiResponse.ok(reportService.getSystemReport());
    }

    @GetMapping("/classes/{classId}")
    @PreAuthorize("hasAnyRole('TEACHER_OWNER', 'CLASS_ADMIN')")
    public ApiResponse<ClassReportResponse> getClassReport(@PathVariable UUID classId) {
        return ApiResponse.ok(reportService.getClassReport(classId));
    }
}
