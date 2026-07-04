package com.hoanobita.topikplatform.submission.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SubmissionResponse(
        UUID id,
        UUID assignmentId,
        String assignmentTitle,
        String className,
        UUID studentId,
        String studentName,
        String contentText,
        String contentUrl,
        UUID fileId,
        String status,
        Instant submittedAt,
        UUID gradeId,
        BigDecimal score,
        BigDecimal maxScore,
        String feedback,
        // Submission file metadata
        String fileName,
        String fileContentType,
        Long fileSize,
        // Feedback attachments
        UUID feedbackFileId,
        String feedbackLink,
        String feedbackFileName,
        String feedbackFileContentType,
        Long feedbackFileSize
) {}
