package com.hoanobita.topikplatform.user.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusRequest(
        @NotBlank(message = "Trạng thái là bắt buộc")
        String status
) {}
