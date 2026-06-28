package com.hoanobita.topikplatform.user;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
import com.hoanobita.topikplatform.user.dto.*;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.RoleRepository;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAllActive().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(UUID id) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        return toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, User currentUser) {
        // Validate email or phone required
        if ((request.email() == null || request.email().isBlank()) &&
            (request.phone() == null || request.phone().isBlank())) {
            throw BusinessException.badRequest("Email or phone is required");
        }

        // Validate email format if provided
        if (request.email() != null && !request.email().isBlank()) {
            if (!request.email().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
                throw BusinessException.badRequest("Invalid email format");
            }
            if (userRepository.existsByEmail(request.email())) {
                throw BusinessException.conflict("Email already exists");
            }
        }

        // Validate phone uniqueness if provided
        if (request.phone() != null && !request.phone().isBlank()) {
            if (userRepository.existsByPhone(request.phone())) {
                throw BusinessException.conflict("Phone already exists");
            }
        }

        // Parse role
        RoleName roleName;
        try {
            roleName = RoleName.valueOf(request.role());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid role: " + request.role());
        }

        // Admin can only create students
        if (currentUser.isAdmin() && !currentUser.isTeacher() && roleName != RoleName.STUDENT) {
            throw BusinessException.forbidden("Admin can only create students");
        }

        var role = roleRepository.findByName(roleName)
                .orElseThrow(() -> BusinessException.notFound("Role not found"));

        // Generate temporary password
        String tempPassword = "TempPass" + UUID.randomUUID().toString().substring(0, 6) + "!";

        var user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email() != null && !request.email().isBlank() ? request.email() : null);
        user.setPhone(request.phone() != null && !request.phone().isBlank() ? request.phone() : null);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setFirstLogin(true);
        user.setNote(request.note());
        user.setCreatedBy(currentUser.getId());
        user.getRoles().add(role);

        user = userRepository.save(user);

        var resp = toResponse(user);
        // Return with temporary password for dev/local
        return new UserResponse(
                resp.id(), resp.fullName(), resp.email(), resp.phone(),
                resp.status(), resp.firstLogin(), resp.avatarUrl(), resp.note(),
                resp.roles(), resp.createdAt(), tempPassword
        );
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.email() != null) {
            if (!request.email().equals(user.getEmail()) && userRepository.existsByEmail(request.email())) {
                throw BusinessException.conflict("Email already exists");
            }
            user.setEmail(request.email());
        }
        if (request.phone() != null) {
            if (!request.phone().equals(user.getPhone()) && userRepository.existsByPhone(request.phone())) {
                throw BusinessException.conflict("Phone already exists");
            }
            user.setPhone(request.phone());
        }
        if (request.note() != null) user.setNote(request.note());

        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateStatus(UUID id, StatusRequest request) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        UserStatus status;
        try {
            status = UserStatus.valueOf(request.status());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid status: " + request.status());
        }

        user.setStatus(status);
        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        user.softDelete();
        userRepository.save(user);
    }

    private UserResponse toResponse(User user) {
        var roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getStatus().name(), user.isFirstLogin(), user.getAvatarUrl(),
                user.getNote(), roles, user.getCreatedAt()
        );
    }
}
