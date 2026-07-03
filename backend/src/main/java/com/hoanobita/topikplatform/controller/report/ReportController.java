package com.hoanobita.topikplatform.controller.report;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.dto.report.ClassReportResponse;
import com.hoanobita.topikplatform.dto.report.SystemReportResponse;
import com.hoanobita.topikplatform.service.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
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

    @GetMapping("/system/export")
    @PreAuthorize("hasRole('TEACHER_OWNER')")
    public ResponseEntity<byte[]> exportSystemReport(@RequestParam(defaultValue = "csv") String format) {
        return csvDownload(reportService.exportSystemReportCsv(), "system-report.csv");
    }

    @GetMapping("/classes/{classId}")
    @PreAuthorize("hasAnyRole('TEACHER_OWNER', 'CLASS_ADMIN')")
    public ApiResponse<ClassReportResponse> getClassReport(@PathVariable UUID classId) {
        return ApiResponse.ok(reportService.getClassReport(classId));
    }

    @GetMapping("/classes/{classId}/export")
    @PreAuthorize("hasAnyRole('TEACHER_OWNER', 'CLASS_ADMIN')")
    public ResponseEntity<byte[]> exportClassReport(@PathVariable UUID classId,
                                                    @RequestParam(defaultValue = "csv") String format) {
        return csvDownload(reportService.exportClassReportCsv(classId), "class-report-" + classId + ".csv");
    }

    private ResponseEntity<byte[]> csvDownload(String csv, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
