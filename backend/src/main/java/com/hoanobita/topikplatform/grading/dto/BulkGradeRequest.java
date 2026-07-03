package com.hoanobita.topikplatform.grading.dto;

import java.util.List;

public record BulkGradeRequest(
        List<BulkGradeItemRequest> grades
) {}
