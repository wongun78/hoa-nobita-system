package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.dto.AssignmentRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentResponse;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AssignmentService {
    private final AssignmentRepository repo;
    private final KlassRepository klasses;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final ActivityService activityService;

    public AssignmentService(AssignmentRepository repo, KlassRepository klasses, PermissionService permissions, SecurityUtils security, ActivityService activityService) {
        this.repo = repo;
        this.klasses = klasses;
        this.permissions = permissions;
        this.security = security;
        this.activityService = activityService;
    }

    public List<AssignmentResponse> list(UUID classId) {
        User user = security.currentUser();
        if (classId != null) {
            permissions.requireAccessClass(user, classId);
            List<Assignment> items = user.isStudent()
                    ? repo.findByClassIdAndStatusIn(classId, List.of(AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED))
                    : repo.findByClassId(classId);
            return items.stream().map(this::toResponse).toList();
        }
        if (user.isTeacher()) return repo.findAllActive().stream().map(this::toResponse).toList();
        List<UUID> ids = permissions.getAccessibleClassIds(user);
        if (ids == null || ids.isEmpty()) return List.of();
        List<Assignment> items = user.isStudent()
                ? repo.findByClassIdInAndStatusIn(ids, List.of(AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED))
                : repo.findByClassIdIn(ids);
        return items.stream().map(this::toResponse).toList();
    }

    public AssignmentResponse get(UUID id) {
        Assignment a = find(id);
        User user = security.currentUser();
        permissions.requireAccessClass(user, a.getClassId());
        if (user.isStudent() && a.getStatus() == AssignmentStatus.DRAFT) throw BusinessException.notFound("Assignment not found");
        return toResponse(a);
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
        activityService.log("ASSIGNMENT_CREATED", "ASSIGNMENT", a.getId(), a.getTitle(), classId, "Đã tạo bài tập mới: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse update(UUID id, AssignmentRequest req) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        validate(req);
        apply(a, req);
        repo.save(a);
        activityService.log("ASSIGNMENT_UPDATED", "ASSIGNMENT", a.getId(), a.getTitle(), a.getClassId(), "Đã cập nhật bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse publish(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.PUBLISHED);
        repo.save(a);
        activityService.log("ASSIGNMENT_PUBLISHED", "ASSIGNMENT", a.getId(), a.getTitle(), a.getClassId(), "Đã xuất bản bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse close(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.CLOSED);
        repo.save(a);
        activityService.log("ASSIGNMENT_CLOSED", "ASSIGNMENT", a.getId(), a.getTitle(), a.getClassId(), "Đã đóng bài tập: " + a.getTitle());
        return toResponse(a);
    }

    @Transactional
    public void delete(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setDeletedAt(Instant.now());
        repo.save(a);
        activityService.log("ASSIGNMENT_DELETED", "ASSIGNMENT", a.getId(), a.getTitle(), a.getClassId(), "Đã xóa bài tập: " + a.getTitle());
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
        a.setStatus(AssignmentStatus.DRAFT);
        repo.save(a);
        activityService.log("ASSIGNMENT_COPIED", "ASSIGNMENT", a.getId(), a.getTitle(), a.getClassId(), "Đã sao chép bài tập: " + src.getTitle());
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
    }

    public AssignmentResponse toResponse(Assignment a) {
        String className = klasses.findById(a.getClassId()).map(k -> k.getName()).orElse(null);
        return new AssignmentResponse(a.getId(), a.getClassId(), className, a.getLessonId(), a.getTitle(), a.getDescription(), a.getInstruction(), a.getDueAt(), a.getMaxScore(), a.getStatus().name(), a.isAllowResubmit(), a.getCreatedAt());
    }
}
