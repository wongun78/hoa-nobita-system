package com.hoanobita.topikplatform.activity;

import com.hoanobita.topikplatform.activity.dto.ActivityResponse;
import com.hoanobita.topikplatform.activity.entity.ActivityLog;
import com.hoanobita.topikplatform.activity.repository.ActivityLogRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
        return recentForCurrentUser(null, null, null, null).items();
    }

    public List<ActivityResponse> recentForClass(UUID classId) {
        return recentForClass(classId, null, null, null, null).items();
    }

    public PageResponse<ActivityResponse> recentForCurrentUser(Integer page, Integer size, String sort, String search) {
        int normalizedPage = PageableUtil.normalizePage(page);
        int normalizedSize = PageableUtil.normalizeSize(size);

        User user = security.currentUser();
        List<ActivityResponse> activities;
        if (user.isTeacher()) {
            activities = repo.findTop50ByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
        } else {
            List<UUID> classIds = permissions.getAccessibleClassIds(user);
            if (classIds == null || classIds.isEmpty()) {
                return PageableUtil.paginateInMemory(List.of(), normalizedPage, normalizedSize);
            }
            activities = repo.findTop50ByClassIdInOrderByCreatedAtDesc(classIds).stream().map(this::toResponse).toList();
        }

        List<ActivityResponse> filtered = activities.stream()
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.actionType(), keyword)
                            || containsIgnoreCase(item.targetName(), keyword)
                            || containsIgnoreCase(item.actorName(), keyword)
                            || containsIgnoreCase(item.message(), keyword);
                })
                .toList();

        List<ActivityResponse> sorted = sortActivities(filtered, sort);
        return PageableUtil.paginateInMemory(sorted, normalizedPage, normalizedSize);
    }

    public PageResponse<ActivityResponse> userActivity(UUID userId, Integer page, Integer size, String sort, String search) {
        int normalizedPage = PageableUtil.normalizePage(page);
        int normalizedSize = PageableUtil.normalizeSize(size);

        User currentUser = security.currentUser();
        if (currentUser.isStudent() && !currentUser.getId().equals(userId)) {
            throw BusinessException.forbidden("You can only view your own activity logs");
        }
        if (currentUser.isAdmin() && !currentUser.isTeacher() && !currentUser.getId().equals(userId)
                && !permissions.canAccessStudentProgress(currentUser, userId)) {
            throw BusinessException.forbidden("You can only view activity logs for students in your assigned classes");
        }

        List<ActivityResponse> filtered = repo.findByActorIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.actionType(), keyword)
                            || containsIgnoreCase(item.targetName(), keyword)
                            || containsIgnoreCase(item.message(), keyword);
                })
                .toList();
        List<ActivityResponse> sorted = sortActivities(filtered, sort);
        return PageableUtil.paginateInMemory(sorted, normalizedPage, normalizedSize);
    }

    public PageResponse<ActivityResponse> recentForClass(UUID classId, Integer page, Integer size, String sort, String search) {
        int normalizedPage = PageableUtil.normalizePage(page);
        int normalizedSize = PageableUtil.normalizeSize(size);

        User user = security.currentUser();
        permissions.requireAccessClass(user, classId);
        List<ActivityResponse> filtered = repo.findTop50ByClassIdOrderByCreatedAtDesc(classId).stream()
                .map(this::toResponse)
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.actionType(), keyword)
                            || containsIgnoreCase(item.targetName(), keyword)
                            || containsIgnoreCase(item.actorName(), keyword)
                            || containsIgnoreCase(item.message(), keyword);
                })
                .toList();

        List<ActivityResponse> sorted = sortActivities(filtered, sort);
        return PageableUtil.paginateInMemory(sorted, normalizedPage, normalizedSize);
    }

    private List<ActivityResponse> sortActivities(List<ActivityResponse> activities, String sort) {
        Comparator<ActivityResponse> defaultSort = Comparator.comparing(ActivityResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        if (sort == null || sort.isBlank()) return activities.stream().sorted(defaultSort).toList();
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Comparator<ActivityResponse> cmp = switch (field) {
            case "createdAt" -> Comparator.comparing(ActivityResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "actionType" -> Comparator.comparing(ActivityResponse::actionType, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "actorName" -> Comparator.comparing(ActivityResponse::actorName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> null;
        };
        if (cmp == null) return activities.stream().sorted(defaultSort).toList();
        return activities.stream().sorted(desc ? cmp.reversed() : cmp).toList();
    }

    private ActivityResponse toResponse(ActivityLog a) {
        return new ActivityResponse(
                a.getId(), a.getActionType(), a.getTargetType(), a.getTargetId(),
                a.getTargetName(), a.getActorId(), a.getActorName(), a.getClassId(),
                a.getMessage(), a.getCreatedAt()
        );
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
