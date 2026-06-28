package com.hoanobita.topikplatform.dashboard;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.dashboard.dto.AdminDashboardResponse;
import com.hoanobita.topikplatform.dashboard.dto.StudentDashboardResponse;
import com.hoanobita.topikplatform.dashboard.dto.TeacherDashboardResponse;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    public DashboardController(DashboardService dashboardService, SecurityUtils securityUtils) {
        this.dashboardService = dashboardService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/teacher")
    public ApiResponse<TeacherDashboardResponse> teacherDashboard() {
        User user = securityUtils.getCurrentUser();
        return ApiResponse.ok(dashboardService.getTeacherDashboard(user));
    }

    @GetMapping("/admin")
    public ApiResponse<AdminDashboardResponse> adminDashboard() {
        User user = securityUtils.getCurrentUser();
        return ApiResponse.ok(dashboardService.getAdminDashboard(user));
    }

    @GetMapping("/student")
    public ApiResponse<StudentDashboardResponse> studentDashboard() {
        User user = securityUtils.getCurrentUser();
        return ApiResponse.ok(dashboardService.getStudentDashboard(user));
    }
}
