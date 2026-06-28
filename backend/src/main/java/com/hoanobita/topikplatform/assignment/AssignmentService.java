package com.hoanobita.topikplatform.assignment;

import com.hoanobita.topikplatform.assignment.dto.AssignmentRequest;
import com.hoanobita.topikplatform.assignment.dto.AssignmentResponse;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
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
    private final PermissionService permissions;
    private final SecurityUtils security;

    public AssignmentService(AssignmentRepository repo, PermissionService permissions, SecurityUtils security) {
        this.repo = repo;
        this.permissions = permissions;
        this.security = security;
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
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse update(UUID id, AssignmentRequest req) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        validate(req);
        apply(a, req);
        return toResponse(repo.save(a));
    }

    @Transactional
    public AssignmentResponse publish(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.PUBLISHED);
        return toResponse(repo.save(a));
    }

    @Transactional
    public AssignmentResponse close(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setStatus(AssignmentStatus.CLOSED);
        return toResponse(repo.save(a));
    }

    @Transactional
    public void delete(UUID id) {
        Assignment a = find(id);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        a.setDeletedAt(Instant.now());
        repo.save(a);
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
        a.setStatus(AssignmentStatus.DRAFT);
        return toResponse(repo.save(a));
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
        return new AssignmentResponse(a.getId(), a.getClassId(), null, a.getLessonId(), a.getTitle(), a.getDescription(), a.getInstruction(), a.getDueAt(), a.getMaxScore(), a.getStatus().name(), a.isAllowResubmit(), a.getCreatedAt());
    }
}
