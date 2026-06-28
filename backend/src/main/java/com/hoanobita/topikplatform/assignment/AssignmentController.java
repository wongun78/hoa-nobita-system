package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.assignment.dto.AssignmentRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentResponse;
import com.hoanobita.topikplatform.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AssignmentController {
    private final AssignmentService service;

    public AssignmentController(AssignmentService service) {
        this.service = service;
    }

    @GetMapping("/classes/{classId}/assignments")
    public ApiResponse<List<AssignmentResponse>> listByClass(@PathVariable UUID classId) {
        return ApiResponse.ok(service.list(classId));
    }

    @GetMapping("/assignments")
    public ApiResponse<List<AssignmentResponse>> list() {
        return ApiResponse.ok(service.list(null));
    }

    @PostMapping("/classes/{classId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AssignmentResponse> create(@PathVariable UUID classId, @Valid @RequestBody AssignmentRequest req) {
        return ApiResponse.created(service.create(classId, req));
    }

    @GetMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentResponse> get(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.get(assignmentId));
    }

    @PatchMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentResponse> update(@PathVariable UUID assignmentId, @Valid @RequestBody AssignmentRequest req) {
        return ApiResponse.ok(service.update(assignmentId, req));
    }

    @PatchMapping("/assignments/{assignmentId}/publish")
    public ApiResponse<AssignmentResponse> publish(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.publish(assignmentId));
    }

    @PatchMapping("/assignments/{assignmentId}/close")
    public ApiResponse<AssignmentResponse> close(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.close(assignmentId));
    }

    @PostMapping("/assignments/{assignmentId}/copy")
    public ApiResponse<AssignmentResponse> copy(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.copy(assignmentId));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    public ApiResponse<Void> delete(@PathVariable UUID assignmentId) {
        service.delete(assignmentId);
        return ApiResponse.ok(null);
    }
}
