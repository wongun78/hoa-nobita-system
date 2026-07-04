package com.hoanobita.topikplatform.auth;

import com.hoanobita.topikplatform.auth.dto.ChangePasswordRequest;
import com.hoanobita.topikplatform.auth.dto.LoginRequest;
import com.hoanobita.topikplatform.auth.dto.LoginResponse;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
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
            throw BusinessException.unauthorized("Invalid credentials");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw BusinessException.unauthorized("Account is suspended");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw BusinessException.unauthorized("Account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("Invalid credentials");
        }

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
            throw BusinessException.badRequest("Current password is incorrect");
        }

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
}
