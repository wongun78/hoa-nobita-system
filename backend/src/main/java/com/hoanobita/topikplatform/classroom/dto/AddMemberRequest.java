package com.hoanobita.topikplatform.classroom.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddMemberRequest(
        UUID adminId,
        UUID studentId,
        UUID userId
) {
    public UUID resolvedAdminId() { return adminId != null ? adminId : userId; }
    public UUID resolvedStudentId() { return studentId != null ? studentId : userId; }
}
