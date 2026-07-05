package com.hoanobita.topikplatform.common;

import org.springframework.http.HttpStatus;

/**
 * Centralized error codes for the Hoà Nobita TOPIK Platform.
 * Format: DOMAIN_XXX
 */
public enum ErrorCode {

    // === Auth ===
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_001", "Thông tin đăng nhập không hợp lệ"),
    AUTH_ACCOUNT_SUSPENDED(HttpStatus.UNAUTHORIZED, "AUTH_002", "Tài khoản đã bị khóa"),
    AUTH_ACCOUNT_INACTIVE(HttpStatus.UNAUTHORIZED, "AUTH_003", "Tài khoản không hoạt động"),
    AUTH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_004", "Phiên đăng nhập đã hết hạn"),
    AUTH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_005", "Token không hợp lệ"),
    AUTH_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "AUTH_006", "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau"),
    AUTH_PASSWORD_INVALID(HttpStatus.BAD_REQUEST, "AUTH_007", "Mật khẩu không đáp ứng yêu cầu"),
    AUTH_PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "AUTH_008", "Mật khẩu hiện tại không đúng"),

    // === User ===
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "Không tìm thấy người dùng"),
    USER_EMAIL_EXISTS(HttpStatus.CONFLICT, "USER_002", "Email đã tồn tại"),
    USER_PHONE_EXISTS(HttpStatus.CONFLICT, "USER_003", "Số điện thoại đã tồn tại"),
    USER_CANNOT_DELETE_SELF(HttpStatus.BAD_REQUEST, "USER_004", "Không thể xóa tài khoản của chính mình"),
    USER_INVALID_STATUS(HttpStatus.BAD_REQUEST, "USER_005", "Trạng thái người dùng không hợp lệ"),

    // === Class ===
    CLASS_NOT_FOUND(HttpStatus.NOT_FOUND, "CLASS_001", "Không tìm thấy lớp học"),
    CLASS_CODE_EXISTS(HttpStatus.CONFLICT, "CLASS_002", "Mã lớp đã tồn tại"),
    CLASS_ALREADY_ARCHIVED(HttpStatus.BAD_REQUEST, "CLASS_003", "Lớp đã được lưu trữ"),
    CLASS_STUDENT_ALREADY_MEMBER(HttpStatus.CONFLICT, "CLASS_004", "Học viên đã là thành viên của lớp này"),
    CLASS_STUDENT_NOT_MEMBER(HttpStatus.NOT_FOUND, "CLASS_005", "Học viên không phải là thành viên của lớp này"),
    CLASS_ADMIN_NOT_FOUND(HttpStatus.NOT_FOUND, "CLASS_006", "Không tìm thấy quản trị viên trong lớp này"),

    // === Assignment ===
    ASSIGNMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "ASSIGN_001", "Không tìm thấy bài tập"),
    ASSIGNMENT_ALREADY_PUBLISHED(HttpStatus.BAD_REQUEST, "ASSIGN_002", "Bài tập đã được xuất bản"),
    ASSIGNMENT_ALREADY_CLOSED(HttpStatus.BAD_REQUEST, "ASSIGN_003", "Bài tập đã đóng"),
    ASSIGNMENT_CANNOT_EDIT_PUBLISHED(HttpStatus.BAD_REQUEST, "ASSIGN_004", "Không thể chỉnh sửa bài tập đã xuất bản"),
    ASSIGNMENT_DUE_DATE_PAST(HttpStatus.BAD_REQUEST, "ASSIGN_005", "Hạn nộp phải trong tương lai"),

    // === Submission ===
    SUBMISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "SUB_001", "Không tìm thấy bài nộp"),
    SUBMISSION_ALREADY_GRADED(HttpStatus.BAD_REQUEST, "SUB_002", "Không thể sửa bài nộp đã chấm điểm"),
    SUBMISSION_ASSIGNMENT_CLOSED(HttpStatus.BAD_REQUEST, "SUB_003", "Bài tập đã đóng, không thể nộp bài"),
    SUBMISSION_RESUBMIT_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "SUB_004", "Bài tập này không cho phép nộp lại"),
    SUBMISSION_DUPLICATE(HttpStatus.CONFLICT, "SUB_005", "Bạn đã nộp bài cho bài tập này"),

    // === Grading ===
    GRADE_NOT_FOUND(HttpStatus.NOT_FOUND, "GRADE_001", "Không tìm thấy điểm"),
    GRADE_SCORE_EXCEEDS_MAX(HttpStatus.BAD_REQUEST, "GRADE_002", "Điểm vượt quá mức cho phép"),
    GRADE_ALREADY_EXISTS(HttpStatus.CONFLICT, "GRADE_003", "Bài nộp đã được chấm điểm"),

    // === Lesson ===
    LESSON_NOT_FOUND(HttpStatus.NOT_FOUND, "LESSON_001", "Không tìm thấy buổi học"),

    // === Material ===
    MATERIAL_NOT_FOUND(HttpStatus.NOT_FOUND, "MAT_001", "Không tìm thấy tài liệu"),

    // === File ===
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "FILE_001", "Không tìm thấy tệp"),
    FILE_EMPTY(HttpStatus.BAD_REQUEST, "FILE_002", "Tệp trống"),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "FILE_003", "Loại tệp không được phép"),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "FILE_004", "Kích thước tệp vượt quá giới hạn cho phép"),
    FILE_STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_005", "Lưu trữ tệp thất bại"),
    FILE_NOT_ON_DISK(HttpStatus.NOT_FOUND, "FILE_006", "Không tìm thấy tệp trên ổ đĩa"),

    // === Notification ===
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTIF_001", "Không tìm thấy thông báo"),
    NOTIFICATION_FORBIDDEN(HttpStatus.FORBIDDEN, "NOTIF_002", "Không thể truy cập thông báo này"),
    NOTIFICATION_STUDENT_CANNOT_CREATE(HttpStatus.FORBIDDEN, "NOTIF_003", "Học viên không thể tạo thông báo"),

    // === Attendance ===
    ATTENDANCE_NOT_FOUND(HttpStatus.NOT_FOUND, "ATT_001", "Không tìm thấy bản ghi điểm danh"),
    ATTENDANCE_LESSON_NOT_FOUND(HttpStatus.NOT_FOUND, "ATT_002", "Không tìm thấy buổi học để điểm danh"),

    // === Permission ===
    FORBIDDEN(HttpStatus.FORBIDDEN, "PERM_001", "Không có quyền truy cập"),
    TEACHER_ONLY(HttpStatus.FORBIDDEN, "PERM_002", "Thao tác này yêu cầu quyền giáo viên"),
    TEACHER_OR_ADMIN_ONLY(HttpStatus.FORBIDDEN, "PERM_003", "Thao tác này yêu cầu quyền giáo viên hoặc quản trị viên"),

    // === General ===
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "GEN_001", "Dữ liệu không hợp lệ"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "GEN_002", "Lỗi hệ thống"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "GEN_003", "Không tìm thấy tài nguyên"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "GEN_004", "Yêu cầu không hợp lệ");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String code, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() { return httpStatus; }
    public String getCode() { return code; }
    public String getDefaultMessage() { return defaultMessage; }
}
