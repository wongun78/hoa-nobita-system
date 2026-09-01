package com.hoanobita.topikplatform.user.dto;

import java.math.BigDecimal;

public record StudentProgressResponse(
        int totalAssignments,
        int submittedAssignments,
        int gradedAssignments,
        BigDecimal averageScore
) {}