package com.hoanobita.topikplatform.activity;

import com.hoanobita.topikplatform.activity.dto.ActivityResponse;
import com.hoanobita.topikplatform.common.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ActivityController {
    private final ActivityService service;

    public ActivityController(ActivityService service) {
        this.service = service;
    }

    @GetMapping("/activity/recent")
    public ApiResponse<List<ActivityResponse>> recent() {
        return ApiResponse.ok(service.recentForCurrentUser());
    }

    @GetMapping("/classes/{classId}/activity")
    @PreAuthorize("hasAnyRole('TEACHER_OWNER', 'CLASS_ADMIN', 'STUDENT')")
    public ApiResponse<List<ActivityResponse>> recentForClass(@PathVariable UUID classId) {
        return ApiResponse.ok(service.recentForClass(classId));
    }
}
