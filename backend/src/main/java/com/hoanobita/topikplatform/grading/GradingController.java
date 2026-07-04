package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.grading.dto.BulkGradeRequest;
import com.hoanobita.topikplatform.grading.dto.BulkGradeResponse;
import com.hoanobita.topikplatform.grading.dto.GradeRequest;
import com.hoanobita.topikplatform.grading.dto.GradeResponse;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/assignments/{assignmentId}/submissions/bulk-grade")
    public ApiResponse<BulkGradeResponse> bulkGrade(@PathVariable UUID assignmentId,
                                                    @RequestBody BulkGradeRequest req) {
        return ApiResponse.ok(service.bulkGrade(assignmentId, req));
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
}
