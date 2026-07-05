package com.hoanobita.topikplatform.notification;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.notification.dto.NotificationRequest;
import com.hoanobita.topikplatform.notification.dto.NotificationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;
    private final SecurityUtils securityUtils;
    private final PermissionService permissionService;

    public NotificationController(NotificationService service, SecurityUtils securityUtils, PermissionService permissionService) {
        this.service = service;
        this.securityUtils = securityUtils;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> list(@RequestParam(required = false) Integer page,
                                                                @RequestParam(required = false) Integer size,
                                                                @RequestParam(required = false) String sort,
                                                                @RequestParam(required = false) String search,
                                                                @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.list(page, size, sort, search, status));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NotificationResponse> create(@Valid @RequestBody NotificationRequest req) {
        permissionService.requireTeacherOrAdmin(securityUtils.getCurrentUser());
        return ApiResponse.created(service.create(req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        permissionService.requireTeacherOrAdmin(securityUtils.getCurrentUser());
        service.delete(id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable UUID id) {
        return ApiResponse.ok(service.markAsRead(id));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount() {
        return ApiResponse.ok(Map.of("count", service.unreadCount()));
    }

    @PostMapping("/read-all")
    public ApiResponse<Map<String, Integer>> readAll() {
        return ApiResponse.ok(Map.of("count", service.markAllAsRead()));
    }
}
