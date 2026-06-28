package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.common.ApiResponse;
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
    public ApiResponse<List<SubmissionResponse>> classSubmissions(@PathVariable UUID classId) {
        return ApiResponse.ok(service.classSubmissions(classId));
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
