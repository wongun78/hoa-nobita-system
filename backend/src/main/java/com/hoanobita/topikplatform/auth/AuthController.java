package com.hoanobita.topikplatform.auth;

import com.hoanobita.topikplatform.auth.dto.ChangePasswordRequest;
import com.hoanobita.topikplatform.auth.dto.LoginRequest;
import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityUtils securityUtils;

    public AuthController(AuthService authService, SecurityUtils securityUtils) {
        this.authService = authService;
        this.securityUtils = securityUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        var result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var user = securityUtils.getCurrentUser();
        var info = authService.getCurrentUserInfo(user);
        return ResponseEntity.ok(ApiResponse.ok(info));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        var user = securityUtils.getCurrentUser();
        authService.changePassword(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // For JWT-based auth, logout is handled client-side by removing the token.
        // In production, consider token blacklisting or using HttpOnly cookies.
        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công"));
    }
}
