package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.auth.AuthService;
import com.hoanobita.topikplatform.auth.JwtService;
import com.hoanobita.topikplatform.auth.LoginRateLimiter;
import com.hoanobita.topikplatform.auth.dto.LoginRequest;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
import com.hoanobita.topikplatform.common.PasswordValidator;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private LoginRateLimiter rateLimiter;

    @InjectMocks
    private AuthService authService;

    private User activeUser;
    private final String rawPassword = "Password1";
    private final String encodedHash = "$2a$10$encodedHash";

    @BeforeEach
    void setUp() {
        Role role = new Role(RoleName.STUDENT);
        activeUser = new User();
        activeUser.setId(UUID.randomUUID());
        activeUser.setFullName("Test User");
        activeUser.setEmail("test@test.com");
        activeUser.setPhone("0900000000");
        activeUser.setPasswordHash(encodedHash);
        activeUser.setStatus(UserStatus.ACTIVE);
        activeUser.setRoles(Set.of(role));
    }

    @Test
    void login_failureReturnsUnauthorized() {
        var ex = BusinessException.unauthorized("Thông tin đăng nhập không hợp lệ");
        assertEquals(401, ex.getStatus().value());
    }

    @Test
    void login_validCredentials_returnsLoginResponse() {
        when(userRepository.findByEmailOrPhone("test@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(rawPassword, encodedHash)).thenReturn(true);
        when(jwtService.generateToken(activeUser)).thenReturn("jwt-token");
        when(jwtService.getExpiresSeconds()).thenReturn(3600L);

        var req = new LoginRequest("test@test.com", rawPassword);
        var result = authService.login(req);

        assertNotNull(result);
        assertEquals("jwt-token", result.accessToken());
        assertEquals("Bearer", result.tokenType());
        verify(rateLimiter).checkRateLimit(any());
        verify(rateLimiter).recordSuccess(any());
    }

    @Test
    void login_invalidPassword_throwsUnauthorizedAndRecordsFailure() {
        when(userRepository.findByEmailOrPhone("test@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong", encodedHash)).thenReturn(false);

        var req = new LoginRequest("test@test.com", "wrong");
        assertThrows(BusinessException.class, () -> authService.login(req));
        verify(rateLimiter).recordFailure(any());
    }

    @Test
    void login_nonExistentUser_throwsUnauthorizedAndRecordsFailure() {
        when(userRepository.findByEmailOrPhone("nobody@test.com")).thenReturn(Optional.empty());

        var req = new LoginRequest("nobody@test.com", rawPassword);
        assertThrows(BusinessException.class, () -> authService.login(req));
        verify(rateLimiter).recordFailure(any());
    }

    @Test
    void login_suspendedUser_throwsUnauthorizedAndRecordsFailure() {
        activeUser.setStatus(UserStatus.SUSPENDED);
        when(userRepository.findByEmailOrPhone("test@test.com")).thenReturn(Optional.of(activeUser));

        var req = new LoginRequest("test@test.com", rawPassword);
        assertThrows(BusinessException.class, () -> authService.login(req));
        verify(rateLimiter).recordFailure(any());
    }

    @Test
    void login_inactiveUser_throwsUnauthorizedAndRecordsFailure() {
        activeUser.setStatus(UserStatus.INACTIVE);
        when(userRepository.findByEmailOrPhone("test@test.com")).thenReturn(Optional.of(activeUser));

        var req = new LoginRequest("test@test.com", rawPassword);
        assertThrows(BusinessException.class, () -> authService.login(req));
        verify(rateLimiter).recordFailure(any());
    }

    // --- PasswordValidator tests ---

    @Test
    void passwordValidator_validPassword_noErrors() {
        var errors = PasswordValidator.validate("GoodPass1");
        assertTrue(errors.isEmpty());
    }

    @Test
    void passwordValidator_tooShort_returnsError() {
        var errors = PasswordValidator.validate("Ab1");
        assertFalse(errors.isEmpty());
        assertTrue(errors.stream().anyMatch(e -> e.contains("8 ký tự")));
    }

    @Test
    void passwordValidator_noUppercase_returnsError() {
        var errors = PasswordValidator.validate("password1");
        assertFalse(errors.isEmpty());
    }

    @Test
    void passwordValidator_noDigit_returnsError() {
        var errors = PasswordValidator.validate("Password");
        assertFalse(errors.isEmpty());
    }

    @Test
    void passwordValidator_requireValid_throwsOnInvalid() {
        assertThrows(BusinessException.class, () -> PasswordValidator.requireValid("weak"));
    }

    @Test
    void passwordValidator_requireValid_doesNotThrowOnValid() {
        assertDoesNotThrow(() -> PasswordValidator.requireValid("GoodPass1"));
    }
}
