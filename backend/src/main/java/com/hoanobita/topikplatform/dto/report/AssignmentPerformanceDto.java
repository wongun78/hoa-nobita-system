package com.hoanobita.topikplatform.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentPerformanceDto {
    private UUID assignmentId;
    private String title;
    private long submissionCount;
    private double averageScore;
    private double passRate;
}
