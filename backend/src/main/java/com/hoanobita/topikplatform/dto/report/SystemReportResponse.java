package com.hoanobita.topikplatform.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemReportResponse {
    private long totalUsers;
    private long totalClasses;
    private long totalAssignments;
    private long totalSubmissions;
    private double averageScore;
    private List<ClassPerformanceDto> classPerformances;
    private List<StudentPerformanceDto> topStudents;
}
