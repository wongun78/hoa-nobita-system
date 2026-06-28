package com.hoanobita.topikplatform.auth.dto;

import java.util.List;
import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            UUID id,
            String fullName,
            String email,
            String phone,
            List<String> roles,
            boolean firstLogin
    ) {}
}
