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
public class StudentPerformanceDto {
    private UUID userId;
    private String fullName;
    private String email;
    private long submissionCount;
    private double averageScore;
}
