package com.hoanobita.topikplatform.user.dto;

public record UpdateProfileRequest(
        String fullName,
        String phone,
        String avatarUrl
) {}
