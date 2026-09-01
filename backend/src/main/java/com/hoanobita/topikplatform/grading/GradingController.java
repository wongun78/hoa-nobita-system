package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.grading.dto.GradeRequest;
import com.hoanobita.topikplatform.grading.dto.GradeResponse;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class GradingController {
    private final GradingService service;

    public GradingController(GradingService service) {
        this.service = service;
    }

    @GetMapping("/classes/{classId}/grading/submissions")
    public ApiResponse<PageResponse<SubmissionResponse>> classSubmissions(@PathVariable UUID classId,
                                                                          @RequestParam(required = false) Integer page,
                                                                          @RequestParam(required = false) Integer size,
                                                                          @RequestParam(required = false) String sort,
                                                                          @RequestParam(required = false) String search,
                                                                          @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.classSubmissions(classId, page, size, sort, search, status));
    }

    @GetMapping("/grading/submissions")
    public ApiResponse<PageResponse<SubmissionResponse>> submissions(@RequestParam(required = false) UUID classId,
                                                                     @RequestParam(required = false) Integer page,
                                                                     @RequestParam(required = false) Integer size,
                                                                     @RequestParam(required = false) String sort,
                                                                     @RequestParam(required = false) String search,
                                                                     @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.submissions(classId, page, size, sort, search, status));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ApiResponse<GradeResponse> grade(@PathVariable UUID submissionId, @Valid @RequestBody GradeRequest req) {
        return ApiResponse.ok(service.grade(submissionId, req));
    }

    @PatchMapping("/grades/{gradeId}")
    public ApiResponse<GradeResponse> update(@PathVariable UUID gradeId, @Valid @RequestBody GradeRequest req) {
        return ApiResponse.ok(service.update(gradeId, req));
    }

    @PostMapping("/submissions/{submissionId}/request-resubmit")
    public ApiResponse<Void> requestResubmit(@PathVariable UUID submissionId) {
        service.requestResubmit(submissionId);
        return ApiResponse.ok(null);
    }

    @GetMapping(value = "/assignments/{assignmentId}/submissions/export-zip", produces = "application/zip")
    public ResponseEntity<byte[]> exportSubmissionsZip(@PathVariable UUID assignmentId, @RequestParam(required = false) UUID classId) {
        byte[] zip = service.exportSubmissionsZip(assignmentId, classId);
        String filename = service.buildExportFilename(assignmentId, classId);
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(zip);
    }
}
