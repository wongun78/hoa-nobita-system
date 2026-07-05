package com.hoanobita.topikplatform.submission.dto.validator;

import com.hoanobita.topikplatform.submission.dto.SubmissionRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AtLeastOneFieldValidator implements ConstraintValidator<AtLeastOneField, SubmissionRequest> {

    @Override
    public boolean isValid(SubmissionRequest value, ConstraintValidatorContext context) {
        if (value == null) return false;
        return (value.contentText() != null && !value.contentText().isBlank())
                || (value.contentUrl() != null && !value.contentUrl().isBlank())
                || value.fileId() != null
                || (value.fileIds() != null && !value.fileIds().isEmpty());
    }
}
