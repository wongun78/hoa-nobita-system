package com.hoanobita.topikplatform.user.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusRequest(
        @NotBlank(message = "Status is required")
        String status
) {}
