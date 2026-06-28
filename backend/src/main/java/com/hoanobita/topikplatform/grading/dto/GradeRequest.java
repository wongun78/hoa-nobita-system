package com.hoanobita.topikplatform.grading.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record GradeRequest(
        @NotNull @DecimalMin("0.0") BigDecimal score,
        String feedback
) {}
