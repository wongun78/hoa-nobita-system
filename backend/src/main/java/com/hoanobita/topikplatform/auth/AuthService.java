package com.hoanobita.topikplatform.auth;

import com.hoanobita.topikplatform.auth.dto.ChangePasswordRequest;
import com.hoanobita.topikplatform.auth.dto.LoginRequest;
import com.hoanobita.topikplatform.auth.dto.LoginResponse;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.PasswordValidator;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter rateLimiter;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, LoginRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rateLimiter = rateLimiter;
    }

    public LoginResponse login(LoginRequest request) {
        String clientIp = getClientIp();
        rateLimiter.checkRateLimit(clientIp);

        var user = userRepository.findByEmailOrPhone(request.identifier())
                .orElse(null);

        // Support username login: "d01" → try "d01@hoanobita.edu.vn"
        if (user == null && !request.identifier().contains("@")) {
            user = userRepository.findByEmailOrPhone(request.identifier() + "@hoanobita.edu.vn")
                    .orElse(null);
        }
        // Also try @hoanobita.com domain (e.g. hoateacher)
        if (user == null && !request.identifier().contains("@")) {
            user = userRepository.findByEmailOrPhone(request.identifier() + "@hoanobita.com")
                    .orElse(null);
        }

        if (user == null) {
            rateLimiter.recordFailure(clientIp);
            throw BusinessException.unauthorized("Thông tin đăng nhập không hợp lệ");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            rateLimiter.recordFailure(clientIp);
            throw BusinessException.unauthorized("Tài khoản đã bị khóa");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            rateLimiter.recordFailure(clientIp);
            throw BusinessException.unauthorized("Tài khoản không hoạt động");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            rateLimiter.recordFailure(clientIp);
            throw BusinessException.unauthorized("Thông tin đăng nhập không hợp lệ");
        }

        rateLimiter.recordSuccess(clientIp);

        String token = jwtService.generateToken(user);
        var roles = user.getRoles().stream().map(r -> r.getName().name()).toList();

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpiresSeconds(),
                new LoginResponse.UserInfo(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        roles,
                        user.isFirstLogin()
                )
        );
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw BusinessException.badRequest("Mật khẩu hiện tại không đúng");
        }

        PasswordValidator.requireValid(request.newPassword());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFirstLogin(false);
        userRepository.save(user);
    }

    public LoginResponse.UserInfo getCurrentUserInfo(User user) {
        var roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new LoginResponse.UserInfo(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                roles,
                user.isFirstLogin()
        );
    }

    private String getClientIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return "unknown";
            HttpServletRequest req = attrs.getRequest();
            String forwarded = req.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return req.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
