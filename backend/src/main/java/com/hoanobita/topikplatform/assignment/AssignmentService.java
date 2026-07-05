package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.dto.AssignmentProgressResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentResponse;
import com.hoanobita.topikplatform.assignment.dto.CreateAssignmentMultiRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderDispatchResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderPreviewResponse;
import com.hoanobita.topikplatform.assignment.dto.AssignmentReminderRequest;
import com.hoanobita.topikplatform.assignment.dto.BatchAssignmentReminderDispatchResponse;
import com.hoanobita.topikplatform.assignment.dto.BatchAssignmentReminderRequest;
import com.hoanobita.topikplatform.assignment.dto.MissingStudentResponse;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class AssignmentService {
    private static final String ENTITY_ASSIGNMENT = "ASSIGNMENT";

    private final AssignmentRepository repo;
    private final KlassRepository klasses;
    private final ClassMemberRepository classMembers;
    private final SubmissionRepository submissions;
    private final UserRepository users;
    private final NotificationRepository notifications;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final ActivityService activityService;

    public AssignmentService(AssignmentRepository repo, KlassRepository klasses,
                             ClassMemberRepository classMembers, SubmissionRepository submissions,
                             UserRepository users, NotificationRepository notifications,
                             PermissionService permissions, SecurityUtils security,
                             ActivityService activityService) {
        this.repo = repo;
        this.klasses = klasses;
        this.classMembers = classMembers;
        this.submissions = submissions;
        this.users = users;
        this.notifications = notifications;
        this.permissions = permissions;
        this.security = security;
        this.activityService = activityService;
    }

    public PageResponse<AssignmentResponse> list(UUID classId, Integer page, Integer size, String sort, String search, String status) {
        User user = security.currentUser();

        Pageable pageable = PageableUtil.of(page, size, sort,
                Set.of("createdAt", "title", "dueAt", "status"),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Assignment> assignmentPage;
        if (classId != null) {
            permissions.requireAccessClass(user, classId);
            assignmentPage = repo.findByClassId(classId, pageable);
        } else if (user.isTeacher()) {
            assignmentPage = repo.findAll(pageable);
        } else {
            List<UUID> ids = permissions.getAccessibleClassIds(user);
            if (ids == null || ids.isEmpty()) {
                return PageableUtil.toPageResponse(Page.empty(pageable));
            }
            // For students/admins with multiple classes, we still need to load all from accessible classes
            // This is acceptable since the number of classes per user is bounded
            var allItems = repo.findByClassIdIn(ids);
            // Filter by status for students
            if (user.isStudent()) {
                allItems = allItems.stream()
                        .filter(a -> a.getStatus() == AssignmentStatus.PUBLISHED || a.getStatus() == AssignmentStatus.CLOSED)
                        .toList();
            }
            // Manual pagination for cross-class queries
            int normalizedPage = PageableUtil.normalizePage(page);
            int normalizedSize = PageableUtil.normalizeSize(size);
            List<AssignmentResponse> mapped = allItems.stream().map(this::toResponse).toList();
            int start = normalizedPage * normalizedSize;
            int end = Math.min(start + normalizedSize, mapped.size());
            List<AssignmentResponse> pageItems = start < mapped.size() ? mapped.subList(start, end) : List.of();
            var springPage = new org.springframework.data.domain.PageImpl<>(pageItems, pageable, mapped.size());
            return PageableUtil.toPageResponse(springPage);
        }

        return PageableUtil.toPageResponse(assignmentPage.map(this::toResponse));
    }

    public AssignmentResponse get(UUID id) {
        Assignment a = find(id);
        User user = security.currentUser();
        permissions.requireAccessClass(user, a.getClassId());
        if (user.isStudent() && a.getStatus() == AssignmentStatus.DRAFT) throw BusinessException.notFound("Assignment not found");
        return toResponse(a);
    }

    public AssignmentReminderPreviewResponse previewMissingStudents(UUID assignmentId) {
        Assignment assignment = find(assignmentId);
        permissions.requireManageClass(security.currentUser(), assignment.getClassId());

        List<ClassMember> activeMembers = classMembers.findByClassIdAndStatus(assignment.getClassId(), MemberStatus.ACTIVE);
        List<com.hoanobita.topikplatform.submission.entity.Submission> assignmentSubmissions = submissions.findByAssignmentId(assignmentId);

        Set<UUID> submittedStudentIds = new HashSet<>();
        for (var submission : assignmentSubmissions) {
            if (submission.getStatus() == SubmissionStatus.SUBMITTED
                    || submission.getStatus() == SubmissionStatus.LATE
                    || submission.getStatus() == SubmissionStatus.GRADED
                    || submission.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED) {
                submittedStudentIds.add(submission.getStudentId());
            }
        }

        List<MissingStudentResponse> missingStudents = activeMembers.stream()
                .filter(member -> !submittedStudentIds.contains(member.getStudentId()))
                .map(member -> users.findById(member.getStudentId()).orElse(null))
            .filter(Objects::nonNull)
                .map(user -> new MissingStudentResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone()))
                .toList();

        String className = klasses.findById(assignment.getClassId()).map(k -> k.getName()).orElse("Unknown");

        return new AssignmentReminderPreviewResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getClassId(),
                className,
                assignment.getDueAt(),
                activeMembers.size(),
                submittedStudentIds.size(),
                missingStudents.size(),
                missingStudents
        );
    }

    public AssignmentProgressResponse getProgress(UUID assignmentId) {
        Assignment assignment = find(assignmentId);
        permissions.requireAccessClass(security.currentUser(), assignment.getClassId());

        List<ClassMember> activeMembers = classMembers.findByClassIdAndStatus(assignment.getClassId(), MemberStatus.ACTIVE);
        List<com.hoanobita.topikplatform.submission.entity.Submission> assignmentSubmissions = submissions.findByAssignmentId(assignmentId);

        Set<UUID> submittedStudentIds = new HashSet<>();
        int lateCount = 0;
        int gradedCount = 0;
        int needGradingCount = 0;
        for (var submission : assignmentSubmissions) {
            SubmissionStatus status = submission.getStatus();
            if (status == SubmissionStatus.SUBMITTED
                    || status == SubmissionStatus.LATE
                    || status == SubmissionStatus.GRADED
                    || status == SubmissionStatus.RESUBMIT_REQUESTED) {
                submittedStudentIds.add(submission.getStudentId());
            }
            if (status == SubmissionStatus.LATE) lateCount++;
            if (status == SubmissionStatus.GRADED) gradedCount++;
            if (status == SubmissionStatus.SUBMITTED || status == SubmissionStatus.LATE) needGradingCount++;
        }

        int totalStudents = activeMembers.size();
        int submittedCount = submittedStudentIds.size();
        int missingCount = totalStudents - submittedCount;

        return new AssignmentProgressResponse(
                assignmentId,
                totalStudents,
                submittedCount,
                missingCount,
                lateCount,
                gradedCount,
                needGradingCount
        );
    }

    @Transactional
    public AssignmentReminderDispatchResponse sendReminder(UUID assignmentId, AssignmentReminderRequest request) {
        AssignmentReminderPreviewResponse preview = previewMissingStudents(assignmentId);
        User currentUser = security.currentUser();

        if (preview.missingCount() == 0) {
            throw BusinessException.badRequest("No missing students to remind for this assignment");
        }

        return dispatchReminder(preview, request, currentUser);
    }

    @Transactional
    public BatchAssignmentReminderDispatchResponse sendBatchReminders(UUID classId, BatchAssignmentReminderRequest request) {
        User currentUser = security.currentUser();
        permissions.requireManageClass(currentUser, classId);

        List<Assignment> candidates;
        if (request == null || request.assignmentIds() == null || request.assignmentIds().isEmpty()) {
            candidates = repo.findByClassIdAndStatusIn(classId, List.of(AssignmentStatus.PUBLISHED));
        } else {
            Set<UUID> uniqueIds = new LinkedHashSet<>(request.assignmentIds());
            candidates = uniqueIds.stream()
                    .map(this::find)
                    .filter(assignment -> assignment.getClassId().equals(classId))
                    .filter(assignment -> assignment.getStatus() == AssignmentStatus.PUBLISHED)
                    .toList();
        }

        List<AssignmentReminderDispatchResponse> dispatches = new ArrayList<>();
        AssignmentReminderRequest sharedTemplate = request == null
                ? null
                : new AssignmentReminderRequest(request.title(), request.content());

        for (Assignment assignment : candidates) {
            AssignmentReminderPreviewResponse preview = previewMissingStudents(assignment.getId());
            if (preview.missingCount() == 0) {
                continue;
            }
            dispatches.add(dispatchReminder(preview, sharedTemplate, currentUser));
        }

        int totalRecipients = dispatches.stream().mapToInt(AssignmentReminderDispatchResponse::recipientCount).sum();
        return new BatchAssignmentReminderDispatchResponse(dispatches.size(), totalRecipients, dispatches);
    }

    private AssignmentReminderDispatchResponse dispatchReminder(
            AssignmentReminderPreviewResponse preview,
            AssignmentReminderRequest request,
            User currentUser
    ) {

        String defaultTitle = "Nhắc nhở nộp bài: " + preview.assignmentTitle();
        String deadlineText = preview.deadline() == null
                ? "chưa đặt"
                : DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"))
                .withZone(ZoneId.systemDefault())
                .format(preview.deadline());
        String defaultContent = "Bài tập [" + preview.assignmentTitle() + "] sắp đến hạn (Deadline: " + deadlineText + "). Bạn chưa nộp bài. Vui lòng nộp ngay!";

        String title = request != null && request.title() != null && !request.title().isBlank() ? request.title() : defaultTitle;
        String content = request != null && request.content() != null && !request.content().isBlank() ? request.content() : defaultContent;

        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setContent(content);
        notification.setTargetType(TargetType.CLASS);
        notification.setTargetId(preview.classId());
        notification.setCreatedBy(currentUser.getId());
        notifications.save(notification);

        activityService.log(
                "ASSIGNMENT_REMINDER_SENT",
                ENTITY_ASSIGNMENT,
            preview.assignmentId(),
                preview.assignmentTitle(),
                preview.classId(),
                "Đã gửi nhắc nhở nộp bài cho " + preview.missingCount() + " học viên chưa nộp"
        );

        return new AssignmentReminderDispatchResponse(
                notification.getId(),
                preview.assignmentId(),
                preview.missingCount(),
                title,
                content,
                notification.getCreatedAt()
        );
    }

    @Transactional
    public AssignmentResponse create(UUID classId, AssignmentRequest req) {
        User user = security.currentUser();
        permissions.requireManageClass(user, classId);
        validate(req);
        Assignment a = new Assignment();
        a.setClassId(classId);
        apply(a, req);
        repo.save(a);
        activityService.log("ASSIGNMENT_CREATED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), classId, "Đã tạo bài tập mới: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public List<AssignmentResponse> createMulti(CreateAssignmentMultiRequest req) {
        User user = security.currentUser();
        if (req.maxScore() != null && req.maxScore().compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("maxScore must be greater than 0");
        }
        List<AssignmentResponse> results = new ArrayList<>();
        for (UUID classId : req.classIds()) {
            permissions.requireManageClass(user, classId);
            Assignment a = new Assignment();
            a.setClassId(classId);
            a.setTitle(req.title());
            a.setDescription(req.description());
            a.setInstruction(req.instruction());
            a.setDueAt(req.dueAt() == null || req.dueAt().isBlank() ? null : Instant.parse(req.dueAt()));
            a.setMaxScore(req.maxScore() != null ? req.maxScore() : BigDecimal.TEN);
            a.setAllowResubmit(Boolean.TRUE.equals(req.allowResubmit()));
            a.setSkill(req.skill());
            a.setFileId(req.fileId());
            a.setExternalLink(req.externalLink());
            repo.save(a);
            activityService.log("ASSIGNMENT_CREATED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), classId, "Đã tạo bài tập mới: " + a.getTitle());
            results.add(toResponse(a));
        }
        return results;
    }

    @Transactional
    public AssignmentResponse update(UUID id, AssignmentRequest req) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        validate(req);
        apply(a, req);
        repo.save(a);
        activityService.log("ASSIGNMENT_UPDATED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), a.getClassId(), "Đã cập nhật bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse publish(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.PUBLISHED);
        repo.save(a);
        activityService.log("ASSIGNMENT_PUBLISHED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), a.getClassId(), "Đã xuất bản bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse close(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.CLOSED);
        repo.save(a);
        activityService.log("ASSIGNMENT_CLOSED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), a.getClassId(), "Đã đóng bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public void delete(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setDeletedAt(Instant.now());
        repo.save(a);
        activityService.log("ASSIGNMENT_DELETED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), a.getClassId(), "Đã xóa bài tập: " + a.getTitle());
    }

    @Transactional
    public AssignmentResponse copy(UUID id) {
        Assignment src = find(id);
        permissions.requireManageClass(security.currentUser(), src.getClassId());
        Assignment a = new Assignment();
        a.setClassId(src.getClassId());
        a.setLessonId(src.getLessonId());
        a.setTitle(src.getTitle() + " (bản sao)");
        a.setDescription(src.getDescription());
        a.setInstruction(src.getInstruction());
        a.setMaxScore(src.getMaxScore());
        a.setAllowResubmit(src.isAllowResubmit());
        a.setDueAt(src.getDueAt());
        a.setSkill(src.getSkill());
        a.setFileId(src.getFileId());
        a.setExternalLink(src.getExternalLink());
        a.setStatus(AssignmentStatus.DRAFT);
        repo.save(a);
        activityService.log("ASSIGNMENT_COPIED", ENTITY_ASSIGNMENT, a.getId(), a.getTitle(), a.getClassId(), "Đã sao chép bài tập: " + src.getTitle());
        return toResponse(a);
    }

    public Assignment find(UUID id) {
        return repo.findActiveById(id).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
    }

    private void validate(AssignmentRequest req) {
        if (req.maxScore() == null || req.maxScore().compareTo(BigDecimal.ZERO) <= 0) throw BusinessException.badRequest("maxScore must be greater than 0");
    }

    private void apply(Assignment a, AssignmentRequest req) {
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setInstruction(req.instruction());
        a.setDueAt(req.dueAt() == null || req.dueAt().isBlank() ? null : Instant.parse(req.dueAt()));
        a.setMaxScore(req.maxScore());
        a.setStatus(req.status() == null || req.status().isBlank() ? AssignmentStatus.DRAFT : AssignmentStatus.valueOf(req.status()));
        a.setAllowResubmit(Boolean.TRUE.equals(req.allowResubmit()));
        a.setSkill(req.skill());
        a.setFileId(req.fileId());
        a.setExternalLink(req.externalLink());
    }

    public AssignmentResponse toResponse(Assignment a) {
        String className = klasses.findById(a.getClassId()).map(k -> k.getName()).orElse(null);
        return new AssignmentResponse(a.getId(), a.getClassId(), className, a.getLessonId(), a.getTitle(), a.getDescription(), a.getInstruction(), a.getDueAt(), a.getMaxScore(), a.getStatus().name(), a.isAllowResubmit(), a.getSkill(), a.getFileId(), a.getExternalLink(), a.getCreatedAt());
    }

}
