package com.hoanobita.topikplatform.user;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final PermissionService permissionService;
    private final ActivityService activityService;

    public UserController(UserService userService, SecurityUtils securityUtils, PermissionService permissionService,
                          ActivityService activityService) {
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.permissionService = permissionService;
        this.activityService = activityService;
    }

    @GetMapping
    public ResponseEntity<?> listUsers(@RequestParam(required = false) Integer page,
                                       @RequestParam(required = false) Integer size,
                                       @RequestParam(required = false) String sort,
                                       @RequestParam(required = false) String search,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(required = false) String role) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacher(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.listUsers(page, size, sort, search, status, role)));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacherOrAdmin(currentUser);
        var result = userService.createUser(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacher(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }

    @GetMapping("/{id}/activity-logs")
    public ResponseEntity<?> getUserActivityLogs(@PathVariable UUID id,
                                                 @RequestParam(required = false) Integer page,
                                                 @RequestParam(required = false) Integer size,
                                                 @RequestParam(required = false) String sort,
                                                 @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(activityService.userActivity(id, page, size, sort, search)));
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getStudentProgress(@PathVariable UUID id) {
        var currentUser = securityUtils.getCurrentUser();
        
        // Students can only view their own progress
        if (currentUser.isStudent() && !currentUser.getId().equals(id)) {
            throw com.hoanobita.topikplatform.common.BusinessException.forbidden("Bạn chỉ có thể xem tiến độ của chính mình");
        }
        
        // Admins can only view progress of students in their assigned classes
        if (currentUser.isAdmin() && !currentUser.isTeacher() && !currentUser.getId().equals(id)) {
            boolean hasAccess = permissionService.canAccessStudentProgress(currentUser, id);
            if (!hasAccess) {
                throw com.hoanobita.topikplatform.common.BusinessException.forbidden("Bạn chỉ có thể xem tiến độ của học viên trong lớp được phân công");
            }
        }
        
        return ResponseEntity.ok(ApiResponse.ok(userService.getStudentProgress(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody UpdateUserRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacher(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.updateUser(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacher(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.updateStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacher(currentUser);
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa người dùng"));
    }
}
