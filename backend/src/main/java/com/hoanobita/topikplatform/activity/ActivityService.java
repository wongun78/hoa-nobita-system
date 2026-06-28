package com.hoanobita.topikplatform.activity;

import com.hoanobita.topikplatform.activity.dto.ActivityResponse;
import com.hoanobita.topikplatform.activity.entity.ActivityLog;
import com.hoanobita.topikplatform.activity.repository.ActivityLogRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ActivityService {
    private static final Logger log = LoggerFactory.getLogger(ActivityService.class);
    private final ActivityLogRepository repo;
    private final PermissionService permissions;
    private final SecurityUtils security;

    public ActivityService(ActivityLogRepository repo, PermissionService permissions, SecurityUtils security) {
        this.repo = repo;
        this.permissions = permissions;
        this.security = security;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String actionType, String targetType, UUID targetId, String targetName, UUID classId, String message) {
        try {
            ActivityLog activity = new ActivityLog();
            activity.setActionType(actionType);
            activity.setTargetType(targetType);
            activity.setTargetId(targetId);
            activity.setTargetName(targetName);
            activity.setClassId(classId);
            activity.setMessage(message);

            try {
                User user = security.currentUser();
                activity.setActorId(user.getId());
                activity.setActorName(user.getFullName());
            } catch (Exception e) {
                activity.setActorName("Hệ thống");
            }

            repo.save(activity);
        } catch (Exception e) {
            log.error("Failed to save activity log: {}", e.getMessage(), e);
        }
    }

    public List<ActivityResponse> recentForCurrentUser() {
        User user = security.currentUser();
        if (user.isTeacher()) {
            return repo.findTop50ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
        }
        
        List<UUID> classIds = permissions.getAccessibleClassIds(user);
        if (classIds == null || classIds.isEmpty()) {
            return List.of();
        }
        
        return repo.findRecentByClassIds(classIds).stream().map(this::toResponse).toList();
    }

    public List<ActivityResponse> recentForClass(UUID classId) {
        User user = security.currentUser();
        if (!user.isTeacher()) {
            List<UUID> classIds = permissions.getAccessibleClassIds(user);
            if (classIds == null || !classIds.contains(classId)) {
                throw BusinessException.forbidden("Cannot access activity for this class");
            }
        }
        return repo.findTop50ByClassIdOrderByCreatedAtDesc(classId).stream().map(this::toResponse).toList();
    }

    private ActivityResponse toResponse(ActivityLog a) {
        return new ActivityResponse(
                a.getId(), a.getActionType(), a.getTargetType(), a.getTargetId(),
                a.getTargetName(), a.getActorId(), a.getActorName(), a.getClassId(),
                a.getMessage(), a.getCreatedAt()
        );
    }
}
