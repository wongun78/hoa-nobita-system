package com.hoanobita.topikplatform.common;

public class Enums {
    public enum RoleName { TEACHER_OWNER, CLASS_ADMIN, STUDENT }
    public enum UserStatus { ACTIVE, INACTIVE, SUSPENDED }
    public enum ClassStatus { DRAFT, ACTIVE, COMPLETED, ARCHIVED }
    public enum LessonStatus { DRAFT, PUBLISHED }
    public enum AssignmentStatus { DRAFT, PUBLISHED, CLOSED }
    public enum SubmissionStatus { SUBMITTED, LATE, GRADED, RESUBMIT_REQUESTED }
    public enum AttendanceStatus { PRESENT, ABSENT, LATE }
    public enum TargetType { CLASS, USER, ALL }
    public enum MemberStatus { ACTIVE, PAUSED, REMOVED }
}
