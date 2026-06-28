package com.hoanobita.topikplatform.classroom.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateClassRequest(
        @NotBlank(message = "Class name is required")
        String name,

        @NotBlank(message = "Class code is required")
        String code,

        String description,
        Integer levelFrom,
        Integer levelTo,
        String startDate,
        String endDate
) {}
