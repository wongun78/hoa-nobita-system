package com.hoanobita.topikplatform.activity;

import com.hoanobita.topikplatform.activity.dto.ActivityResponse;
import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PageResponse;
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
    public ApiResponse<PageResponse<ActivityResponse>> recent(@RequestParam(required = false) Integer page,
                                                              @RequestParam(required = false) Integer size,
                                                              @RequestParam(required = false) String sort,
                                                              @RequestParam(required = false) String search) {
        return ApiResponse.ok(service.recentForCurrentUser(page, size, sort, search));
    }

    @GetMapping("/classes/{classId}/activity")
    @PreAuthorize("hasAnyRole('TEACHER_OWNER', 'CLASS_ADMIN', 'STUDENT')")
    public ApiResponse<PageResponse<ActivityResponse>> recentForClass(@PathVariable UUID classId,
                                                                      @RequestParam(required = false) Integer page,
                                                                      @RequestParam(required = false) Integer size,
                                                                      @RequestParam(required = false) String sort,
                                                                      @RequestParam(required = false) String search) {
        return ApiResponse.ok(service.recentForClass(classId, page, size, sort, search));
    }
}
