package com.hoanobita.topikplatform.assignment.dto;

import java.util.UUID;

public record MissingStudentResponse(
        UUID studentId,
        String fullName,
        String email,
        String phone
) {
}