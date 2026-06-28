package com.hoanobita.topikplatform.user;

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

    public UserController(UserService userService, SecurityUtils securityUtils, PermissionService permissionService) {
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<?> listUsers() {
        var currentUser = securityUtils.getCurrentUser();
        permissionService.requireTeacherOrAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.listUsers()));
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
        permissionService.requireTeacherOrAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
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
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }
}
