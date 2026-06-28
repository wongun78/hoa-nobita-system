package com.hoanobita.topikplatform.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        String status,
        boolean firstLogin,
        String avatarUrl,
        String note,
        List<String> roles,
        Instant createdAt,
        // Only included when creating a user (dev/local)
        String temporaryPassword
) {
    // Constructor without temporaryPassword
    public UserResponse(UUID id, String fullName, String email, String phone, String status,
                        boolean firstLogin, String avatarUrl, String note, List<String> roles, Instant createdAt) {
        this(id, fullName, email, phone, status, firstLogin, avatarUrl, note, roles, createdAt, null);
    }
}
