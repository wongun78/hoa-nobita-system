package com.hoanobita.topikplatform.notification;

import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.notification.dto.NotificationRequest;
import com.hoanobita.topikplatform.notification.dto.NotificationResponse;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repo;
    private final PermissionService permissions;
    private final SecurityUtils security;

    public NotificationService(NotificationRepository repo, PermissionService permissions, SecurityUtils security) {
        this.repo = repo;
        this.permissions = permissions;
        this.security = security;
    }

    public List<NotificationResponse> list() {
        User user = security.currentUser();
        if (user.isTeacher()) return repo.findAllOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
        List<UUID> classIds = permissions.getAccessibleClassIds(user);
        if (classIds == null) classIds = List.of();
        return repo.findForUser(user.getId(), classIds).stream().map(this::toResponse).toList();
    }

    @Transactional
    public NotificationResponse create(NotificationRequest req) {
        User user = security.currentUser();
        if (user.isStudent()) throw BusinessException.forbidden("Students cannot create notifications");
        if (req.targetType() == TargetType.ALL) permissions.requireTeacher(user);
        if (req.targetType() == TargetType.CLASS) {
            if (req.targetId() == null) throw BusinessException.badRequest("Class target is required");
            permissions.requireManageClass(user, req.targetId());
        }
        if (req.targetType() == TargetType.USER && !user.isTeacher()) throw BusinessException.forbidden("Only teacher can target users directly");
        Notification n = new Notification();
        n.setTitle(req.title());
        n.setContent(req.content());
        n.setTargetType(req.targetType());
        n.setTargetId(req.targetId());
        n.setCreatedBy(user.getId());
        return toResponse(repo.save(n));
    }

    @Transactional
    public void delete(UUID id) {
        User user = security.currentUser();
        Notification n = repo.findById(id).orElseThrow(() -> BusinessException.notFound("Notification not found"));
        if (!user.isTeacher() && !n.getCreatedBy().equals(user.getId())) throw BusinessException.forbidden("Cannot delete this notification");
        repo.delete(n);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getContent(), n.getTargetType().name(), n.getTargetId(), n.getCreatedBy(), n.getCreatedAt());
    }
}
