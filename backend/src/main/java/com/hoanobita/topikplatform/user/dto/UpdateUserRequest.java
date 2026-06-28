package com.hoanobita.topikplatform.user.dto;

public record UpdateUserRequest(
        String fullName,
        String email,
        String phone,
        String note
) {}
