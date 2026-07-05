package com.hoanobita.topikplatform.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 1, max = 200, message = "Full name must be 1-200 characters") String fullName,
        @Email(message = "Định dạng email không hợp lệ") String email,
        String phone,
        String note
) {}
