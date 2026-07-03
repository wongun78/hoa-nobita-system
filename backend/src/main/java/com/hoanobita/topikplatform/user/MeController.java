package com.hoanobita.topikplatform.user;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.dto.UpdateProfileRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dedicated controller for the current user's own profile at PATCH /api/v1/me,
 * distinct from /api/v1/auth/me (GET) and /api/v1/users/{id} (admin-managed).
 */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    public MeController(UserService userService, SecurityUtils securityUtils) {
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    @PatchMapping
    public ResponseEntity<?> updateMyProfile(@RequestBody UpdateProfileRequest request) {
        var currentUser = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(userService.updateMyProfile(currentUser.getId(), request)));
    }
}
