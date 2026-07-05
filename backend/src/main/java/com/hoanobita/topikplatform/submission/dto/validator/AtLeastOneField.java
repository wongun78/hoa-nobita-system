package com.hoanobita.topikplatform.submission.dto.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AtLeastOneFieldValidator.class)
@Documented
public @interface AtLeastOneField {
    String message() default "Submission must include text, URL, or file";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
