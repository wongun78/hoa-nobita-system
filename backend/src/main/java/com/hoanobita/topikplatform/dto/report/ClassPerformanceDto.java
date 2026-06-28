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
public class ClassPerformanceDto {
    private UUID classId;
    private String className;
    private long studentCount;
    private long assignmentCount;
    private double averageScore;
    private double submissionRate;
}
