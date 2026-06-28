package com.hoanobita.topikplatform.submission;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.submission.dto.SubmissionRequest;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SubmissionController {
    private final SubmissionService service;

    public SubmissionController(SubmissionService service) {
        this.service = service;
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public ApiResponse<List<SubmissionResponse>> byAssignment(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.byAssignment(assignmentId));
    }

    @PostMapping("/assignments/{assignmentId}/submissions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SubmissionResponse> submit(@PathVariable UUID assignmentId, @RequestBody SubmissionRequest req) {
        return ApiResponse.created(service.submit(assignmentId, req));
    }

    @GetMapping("/submissions/{submissionId}")
    public ApiResponse<SubmissionResponse> get(@PathVariable UUID submissionId) {
        return ApiResponse.ok(service.get(submissionId));
    }

    @PatchMapping("/submissions/{submissionId}")
    public ApiResponse<SubmissionResponse> update(@PathVariable UUID submissionId, @RequestBody SubmissionRequest req) {
        return ApiResponse.ok(service.update(submissionId, req));
    }

    @DeleteMapping("/submissions/{submissionId}")
    public ApiResponse<Void> delete(@PathVariable UUID submissionId) {
        service.delete(submissionId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/me/submissions")
    public ApiResponse<List<SubmissionResponse>> mine() {
        return ApiResponse.ok(service.mySubmissions());
    }
}
