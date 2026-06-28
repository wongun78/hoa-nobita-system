package com.hoanobita.topikplatform.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassReportResponse {
    private UUID classId;
    private String className;
    private long totalStudents;
    private long totalAssignments;
    private double averageScore;
    private double submissionRate;
    private List<StudentPerformanceDto> studentPerformances;
    private List<AssignmentPerformanceDto> assignmentPerformances;
}
