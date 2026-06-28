package com.hoanobita.topikplatform.user.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
        @NotBlank(message = "Full name is required")
        String fullName,

        String email,
        String phone,

        @NotBlank(message = "Role is required")
        String role,

        String note
) {}
