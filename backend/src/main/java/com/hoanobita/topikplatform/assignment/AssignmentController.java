package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.assignment.dto.AssignmentProgressResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderDispatchResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderPreviewResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderRequest;
import com.hoanobita.topikplatform.assignment.dto.BatchAssignmentReminderDispatchResponse;
import com.hoanobita.topikplatform.assignment.dto.BatchAssignmentReminderRequest;
import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PageResponse;
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
    public ApiResponse<PageResponse<AssignmentResponse>> listByClass(@PathVariable UUID classId,
                                                                     @RequestParam(required = false) Integer page,
                                                                     @RequestParam(required = false) Integer size,
                                                                     @RequestParam(required = false) String sort,
                                                                     @RequestParam(required = false) String search,
                                                                     @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.list(classId, page, size, sort, search, status));
    }

    @GetMapping("/assignments")
    public ApiResponse<PageResponse<AssignmentResponse>> list(@RequestParam(required = false) UUID classId,
                                                              @RequestParam(required = false) Integer page,
                                                              @RequestParam(required = false) Integer size,
                                                              @RequestParam(required = false) String sort,
                                                              @RequestParam(required = false) String search,
                                                              @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.list(classId, page, size, sort, search, status));
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

    @GetMapping("/assignments/{assignmentId}/progress")
    public ApiResponse<AssignmentProgressResponse> getProgress(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.getProgress(assignmentId));
    }

    @GetMapping("/assignments/{assignmentId}/missing-students")
    public ApiResponse<AssignmentReminderPreviewResponse> previewMissingStudents(@PathVariable UUID assignmentId) {
        return ApiResponse.ok(service.previewMissingStudents(assignmentId));
    }

    @PostMapping("/assignments/{assignmentId}/send-reminder")
    public ApiResponse<AssignmentReminderDispatchResponse> sendReminder(
            @PathVariable UUID assignmentId,
            @RequestBody(required = false) AssignmentReminderRequest request
    ) {
        return ApiResponse.ok(service.sendReminder(assignmentId, request));
    }

    @PostMapping("/classes/{classId}/assignments/send-reminders")
    public ApiResponse<BatchAssignmentReminderDispatchResponse> sendBatchReminders(
            @PathVariable UUID classId,
            @RequestBody(required = false) BatchAssignmentReminderRequest request
    ) {
        return ApiResponse.ok(service.sendBatchReminders(classId, request));
    }
}
