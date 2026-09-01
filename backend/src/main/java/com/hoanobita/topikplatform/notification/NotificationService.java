package com.hoanobita.topikplatform.notification;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.notification.dto.NotificationRequest;
import com.hoanobita.topikplatform.notification.dto.NotificationResponse;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.entity.NotificationRead;
import com.hoanobita.topikplatform.notification.repository.NotificationReadRepository;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repo;
    private final NotificationReadRepository readRepo;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final ActivityService activityService;

    public NotificationService(NotificationRepository repo, NotificationReadRepository readRepo,
                               PermissionService permissions, SecurityUtils security,
                               ActivityService activityService) {
        this.repo = repo;
        this.readRepo = readRepo;
        this.permissions = permissions;
        this.security = security;
        this.activityService = activityService;
    }

    public PageResponse<NotificationResponse> list(Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PageableUtil.normalizePage(page);
        int normalizedSize = PageableUtil.normalizeSize(size);

        User user = security.currentUser();
        List<Notification> notifications = notificationsForUser(user);

        if (notifications.isEmpty()) {
            return PageableUtil.paginateInMemory(List.of(), normalizedPage, normalizedSize);
        }

        Map<UUID, NotificationRead> readMap = readMapFor(user, notifications);
        List<NotificationResponse> filtered = notifications.stream()
                .map(notification -> toResponse(notification, readMap.get(notification.getId())))
                .filter(item -> {
                    if (status == null || status.isBlank()) return true;
                    if ("READ".equalsIgnoreCase(status)) return item.isRead();
                    if ("UNREAD".equalsIgnoreCase(status)) return !item.isRead();
                    return true;
                })
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.title(), keyword)
                            || containsIgnoreCase(item.content(), keyword);
                })
                .toList();

        Comparator<NotificationResponse> comparator = resolveNotificationSort(sort);
        List<NotificationResponse> sorted = filtered.stream().sorted(comparator).toList();
        return PageableUtil.paginateInMemory(sorted, normalizedPage, normalizedSize);
    }

    private Comparator<NotificationResponse> resolveNotificationSort(String sort) {
        Comparator<NotificationResponse> defaultSort = Comparator.comparing(NotificationResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        if (sort == null || sort.isBlank()) return defaultSort;
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Comparator<NotificationResponse> cmp = switch (field) {
            case "createdAt" -> Comparator.comparing(NotificationResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "title" -> Comparator.comparing(NotificationResponse::title, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> null;
        };
        if (cmp == null) return defaultSort;
        return desc ? cmp.reversed() : cmp;
    }

    public long unreadCount() {
        User user = security.currentUser();
        List<Notification> notifications = notificationsForUser(user);
        if (notifications.isEmpty()) return 0;
        Map<UUID, NotificationRead> readMap = readMapFor(user, notifications);
        return notifications.stream().filter(n -> !readMap.containsKey(n.getId())).count();
    }

    @Transactional
    public int markAllAsRead() {
        User user = security.currentUser();
        List<Notification> notifications = notificationsForUser(user);
        if (notifications.isEmpty()) return 0;

        Map<UUID, NotificationRead> readMap = readMapFor(user, notifications);
        Instant now = Instant.now();
        int markedCount = 0;
        for (Notification notification : notifications) {
            if (readMap.containsKey(notification.getId())) continue;
            NotificationRead read = new NotificationRead();
            read.setNotificationId(notification.getId());
            read.setUserId(user.getId());
            read.setReadAt(now);
            readRepo.save(read);
            markedCount++;
        }
        return markedCount;
    }

    private List<Notification> notificationsForUser(User user) {
        if (user.isTeacher()) {
            return repo.findAllOrderByCreatedAtDesc();
        }
        List<UUID> classIds = permissions.getAccessibleClassIds(user);
        if (classIds == null) classIds = List.of();
        return classIds.isEmpty()
                ? repo.findForUserWithoutClass(user.getId())
                : repo.findForUser(user.getId(), classIds);
    }

    private Map<UUID, NotificationRead> readMapFor(User user, List<Notification> notifications) {
        List<UUID> notificationIds = notifications.stream().map(Notification::getId).toList();
        Map<UUID, NotificationRead> readMap = new HashMap<>();
        for (NotificationRead read : readRepo.findByUserIdAndNotificationIds(user.getId(), notificationIds)) {
            readMap.put(read.getNotificationId(), read);
        }
        return readMap;
    }

    @Transactional
    public NotificationResponse markAsRead(UUID id) {
        User user = security.currentUser();
        Notification notification = repo.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy thông báo"));

        List<UUID> classIds = permissions.getAccessibleClassIds(user);
        if (!canAccessNotification(user, notification, classIds == null ? List.of() : classIds)) {
            throw BusinessException.forbidden("Không thể đánh dấu đã đọc thông báo này");
        }

        NotificationRead read = readRepo.findByNotificationIdAndUserId(id, user.getId()).orElseGet(() -> {
            NotificationRead entity = new NotificationRead();
            entity.setNotificationId(id);
            entity.setUserId(user.getId());
            return entity;
        });
        read.setReadAt(Instant.now());
        read = readRepo.save(read);

        return toResponse(notification, read);
    }

    @Transactional
    public NotificationResponse create(NotificationRequest req) {
        User user = security.currentUser();
        if (user.isStudent()) throw new org.springframework.security.access.AccessDeniedException("Học viên không thể tạo thông báo");
        if (req.targetType() == TargetType.ALL) permissions.requireTeacher(user);
        if (req.targetType() == TargetType.CLASS) {
            if (req.targetId() == null) throw BusinessException.badRequest("Lớp học là bắt buộc");
            permissions.requireManageClass(user, req.targetId());
        }
        if (req.targetType() == TargetType.USER && !user.isTeacher()) throw new org.springframework.security.access.AccessDeniedException("Chỉ giáo viên mới có thể gửi thông báo trực tiếp cho người dùng");
        Notification n = new Notification();
        n.setTitle(req.title());
        n.setContent(req.content());
        n.setTargetType(req.targetType());
        n.setTargetId(req.targetId());
        n.setCreatedBy(user.getId());
        repo.save(n);
        activityService.log("NOTIFICATION_CREATED", "NOTIFICATION", n.getId(), n.getTitle(), req.targetType() == TargetType.CLASS ? req.targetId() : null, "Đã tạo thông báo mới: " + n.getTitle());

        return toResponse(n, null);
    }

    @Transactional
    public void delete(UUID id) {
        User user = security.currentUser();
        Notification n = repo.findById(id).orElseThrow(() -> BusinessException.notFound("Không tìm thấy thông báo"));
        if (!user.isTeacher() && !n.getCreatedBy().equals(user.getId())) throw BusinessException.forbidden("Không thể xóa thông báo này");
        repo.delete(n);
        activityService.log("NOTIFICATION_DELETED", "NOTIFICATION", n.getId(), n.getTitle(), n.getTargetType() == TargetType.CLASS ? n.getTargetId() : null, "Đã xóa thông báo: " + n.getTitle());
    }

    private boolean canAccessNotification(User user, Notification n, List<UUID> classIds) {
        if (user.isTeacher()) return true;
        if (n.getTargetType() == TargetType.ALL) return true;
        if (n.getTargetType() == TargetType.USER) return n.getTargetId() != null && n.getTargetId().equals(user.getId());
        return n.getTargetType() == TargetType.CLASS && n.getTargetId() != null && classIds.contains(n.getTargetId());
    }

    private NotificationResponse toResponse(Notification n, NotificationRead read) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.getTargetType().name(),
                n.getTargetId(),
                n.getCreatedBy(),
                n.getCreatedAt(),
                read != null,
                read == null ? null : read.getReadAt()
        );
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }

}
