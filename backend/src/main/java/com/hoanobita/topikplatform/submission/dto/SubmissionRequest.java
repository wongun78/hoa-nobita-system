package com.hoanobita.topikplatform.submission.dto;

import com.hoanobita.topikplatform.submission.dto.validator.AtLeastOneField;
import java.util.UUID;

@AtLeastOneField
public record SubmissionRequest(String contentText, String contentUrl, UUID fileId) {}
