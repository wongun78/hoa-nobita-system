package com.hoanobita.topikplatform.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 200, message = "Full name must be 1-200 characters") String fullName,
        String phone,
        String avatarUrl
) {}
