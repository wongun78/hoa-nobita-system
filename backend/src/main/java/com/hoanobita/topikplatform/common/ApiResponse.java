package com.hoanobita.topikplatform.common;

import java.util.List;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        List<FieldError> errors
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, "Created", data, null);
    }

    public static ApiResponse<Object> error(String message) {
        return new ApiResponse<>(false, message, null, null);
    }

    public static ApiResponse<Object> validation(List<FieldError> errors) {
        return new ApiResponse<>(false, "Validation failed", null, errors);
    }

    public record FieldError(String field, String message) {}
}
