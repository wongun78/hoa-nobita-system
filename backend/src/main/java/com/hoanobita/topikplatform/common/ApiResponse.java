package com.hoanobita.topikplatform.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        List<FieldError> errors
) {
    // === Success responses ===
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, null, "OK", data, null);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, null, message, data, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, null, "Created", data, null);
    }

    // === Error responses with ErrorCode ===
    public static ApiResponse<Object> error(ErrorCode errorCode) {
        return new ApiResponse<>(false, errorCode.getCode(), errorCode.getDefaultMessage(), null, null);
    }

    public static ApiResponse<Object> error(ErrorCode errorCode, String customMessage) {
        return new ApiResponse<>(false, errorCode.getCode(), customMessage, null, null);
    }

    // === Legacy error responses (backward compatible) ===
    public static ApiResponse<Object> error(String message) {
        return new ApiResponse<>(false, null, message, null, null);
    }

    public static ApiResponse<Object> validation(List<FieldError> errors) {
        return new ApiResponse<>(false, ErrorCode.VALIDATION_ERROR.getCode(), "Dữ liệu không hợp lệ", null, errors);
    }

    public record FieldError(String field, String message) {}
}
