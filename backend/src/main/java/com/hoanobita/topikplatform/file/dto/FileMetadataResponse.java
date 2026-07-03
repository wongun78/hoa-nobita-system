package com.hoanobita.topikplatform.file.dto;

import java.time.Instant;
import java.util.UUID;

public record FileMetadataResponse(
        UUID id,
        String originalFileName,
        String contentType,
        Long fileSize,
        Instant createdAt,
        UUID uploadedBy
) {}
