package com.hoanobita.topikplatform.user.dto;

import java.math.BigDecimal;
import java.util.List;

public record StudentProgressResponse(
        int totalAssignments,
        int submittedAssignments,
        int gradedAssignments,
        BigDecimal averageScore,
        BigDecimal submissionRate,
        String riskLevel,
        List<String> riskReasons
) {}