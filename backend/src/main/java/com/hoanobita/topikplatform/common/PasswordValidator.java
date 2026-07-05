package com.hoanobita.topikplatform.common;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates password strength.
 * Rules: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
 */
public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;

    private PasswordValidator() {
    }

    /**
     * Validates a password and returns a list of violation messages.
     * Returns empty list if the password is valid.
     */
    public static List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null || password.isBlank()) {
            errors.add("Password must not be blank");
            return errors;
        }
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters");
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            errors.add("Password must contain at least 1 uppercase letter");
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            errors.add("Password must contain at least 1 lowercase letter");
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            errors.add("Password must contain at least 1 digit");
        }
        return errors;
    }

    /**
     * Throws BusinessException if password is invalid.
     */
    public static void requireValid(String password) {
        List<String> errors = validate(password);
        if (!errors.isEmpty()) {
            throw BusinessException.badRequest("Invalid password: " + String.join(", ", errors));
        }
    }
}
