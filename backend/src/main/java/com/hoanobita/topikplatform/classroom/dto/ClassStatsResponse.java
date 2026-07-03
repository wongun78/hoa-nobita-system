package com.hoanobita.topikplatform.classroom.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ClassStatsResponse(
        UUID classId,
        int totalStudents,
        int totalAssignments,
        int totalSubmissions,
        int missingSubmissions,
        int lateSubmissions,
        int gradedSubmissions,
        int needGrading,
        BigDecimal submissionRate,
        BigDecimal averageScore
) {
}