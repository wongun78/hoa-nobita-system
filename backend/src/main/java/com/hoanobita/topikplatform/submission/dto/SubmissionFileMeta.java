package com.hoanobita.topikplatform.submission.dto;

import java.util.UUID;

public record SubmissionFileMeta(
        UUID fileId,
        String fileName,
        String contentType,
        Long fileSize
) {}
