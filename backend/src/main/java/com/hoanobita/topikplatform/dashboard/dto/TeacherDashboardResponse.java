package com.hoanobita.topikplatform.dashboard.dto;

import java.util.List;
import java.util.UUID;

public record TeacherDashboardResponse(
        int activeClassCount,
        int activeStudentCount,
        int dueSoonAssignmentCount,
        List<NeedGradingByClass> needGradingByClass
) {
    public record NeedGradingByClass(UUID classId, String className, long count) {}
}