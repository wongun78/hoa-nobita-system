package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.entity.AssignmentAutoReminder;
import com.hoanobita.topikplatform.assignment.repository.AssignmentAutoReminderRepository;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Duration;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class AssignmentAutoReminderScheduler {

    private static final String TYPE_48H = "48H";
    private static final String TYPE_24H = "24H";

    private final AssignmentRepository assignments;
    private final KlassRepository klasses;
    private final ClassMemberRepository classMembers;
    private final SubmissionRepository submissions;
    private final NotificationRepository notifications;
    private final AssignmentAutoReminderRepository reminderRepo;
    private final ActivityService activityService;

    public AssignmentAutoReminderScheduler(
            AssignmentRepository assignments,
            KlassRepository klasses,
            ClassMemberRepository classMembers,
            SubmissionRepository submissions,
            NotificationRepository notifications,
            AssignmentAutoReminderRepository reminderRepo,
            ActivityService activityService
    ) {
        this.assignments = assignments;
        this.klasses = klasses;
        this.classMembers = classMembers;
        this.submissions = submissions;
        this.notifications = notifications;
        this.reminderRepo = reminderRepo;
        this.activityService = activityService;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void runAutoReminders() {
        Instant now = Instant.now();
        for (Assignment assignment : assignments.findAllActive()) {
            if (assignment.getStatus() == AssignmentStatus.PUBLISHED
                    && assignment.getDueAt() != null
                    && assignment.getDueAt().isAfter(now)) {
                long hoursToDeadline = Duration.between(now, assignment.getDueAt()).toHours();
                if (hoursToDeadline <= 48 && hoursToDeadline > 24) {
                    sendAutoReminderIfNeeded(assignment, TYPE_48H);
                }
                if (hoursToDeadline <= 24 && hoursToDeadline > 0) {
                    sendAutoReminderIfNeeded(assignment, TYPE_24H);
                }
            }
        }
    }

    private void sendAutoReminderIfNeeded(Assignment assignment, String reminderType) {
        if (reminderRepo.existsByAssignmentIdAndReminderType(assignment.getId(), reminderType)) {
            return;
        }

        var members = classMembers.findByClassIdAndStatus(assignment.getClassId(), MemberStatus.ACTIVE);
        if (members.isEmpty()) {
            return;
        }

        Set<UUID> submittedStudentIds = submissions.findByAssignmentId(assignment.getId()).stream()
            .filter(submission -> submission.getStatus() == SubmissionStatus.SUBMITTED
                || submission.getStatus() == SubmissionStatus.LATE
                || submission.getStatus() == SubmissionStatus.GRADED
                || submission.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED)
            .map(submission -> submission.getStudentId())
            .collect(Collectors.toSet());

        int missingCount = (int) members.stream().filter(member -> !submittedStudentIds.contains(member.getStudentId())).count();
        if (missingCount == 0) {
            return;
        }

        UUID creatorId = findNotificationCreator(assignment);
        if (creatorId == null) {
            return;
        }

        String deadlineText = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"))
                .withZone(ZoneId.systemDefault())
                .format(assignment.getDueAt());

        Notification notification = new Notification();
        notification.setTitle("[AUTO-" + reminderType + "] Nhắc nhở nộp bài: " + assignment.getTitle());
        notification.setContent("Bài tập [" + assignment.getTitle() + "] sắp đến hạn (Deadline: " + deadlineText + "). " +
                "Hiện còn " + missingCount + " học viên chưa nộp bài.");
        notification.setTargetType(TargetType.CLASS);
        notification.setTargetId(assignment.getClassId());
        notification.setCreatedBy(creatorId);
        notifications.save(notification);

        AssignmentAutoReminder reminder = new AssignmentAutoReminder();
        reminder.setAssignmentId(assignment.getId());
        reminder.setReminderType(reminderType);
        reminderRepo.save(reminder);

        activityService.log(
                "ASSIGNMENT_AUTO_REMINDER_SENT",
                "ASSIGNMENT",
                assignment.getId(),
                assignment.getTitle(),
                assignment.getClassId(),
                "Đã gửi auto reminder " + reminderType + " cho bài tập với " + missingCount + " học viên chưa nộp"
        );
    }

    private UUID findNotificationCreator(Assignment assignment) {
        if (assignment.getCreatedBy() != null) {
            return assignment.getCreatedBy();
        }
        return klasses.findById(assignment.getClassId()).map(klass -> klass.getTeacherId()).orElse(null);
    }
}
