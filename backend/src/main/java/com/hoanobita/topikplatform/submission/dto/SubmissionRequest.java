package com.hoanobita.topikplatform.submission.dto;

import java.util.UUID;

public record SubmissionRequest(String contentText, String contentUrl, UUID fileId) {}
