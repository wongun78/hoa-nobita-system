package com.hoanobita.topikplatform.dashboard.dto;

public record StudentDashboardResponse(
        int joinedClassCount,
        int openAssignmentCount,
        int dueSoonCount,
        int gradedCount,
        int resubmitRequestedCount
) {}