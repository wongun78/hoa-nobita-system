package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.notification.NotificationService;
import com.hoanobita.topikplatform.notification.dto.NotificationRequest;
import com.hoanobita.topikplatform.notification.dto.NotificationResponse;
import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.notification.entity.NotificationRead;
import com.hoanobita.topikplatform.notification.repository.NotificationReadRepository;
import com.hoanobita.topikplatform.notification.repository.NotificationRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository repo;
    @Mock private NotificationReadRepository readRepo;
    @Mock private PermissionService permissions;
    @Mock private SecurityUtils security;
    @Mock private ActivityService activityService;

    @InjectMocks
    private NotificationService notificationService;

    private User teacherUser;
    private User studentUser;
    private Notification sampleNotification;

    @BeforeEach
    void setUp() {
        teacherUser = new User();
        teacherUser.setId(UUID.randomUUID());
        teacherUser.setEmail("teacher@hoanobita.edu.vn");
        teacherUser.setRoles(Set.of(new com.hoanobita.topikplatform.user.entity.Role(Enums.RoleName.TEACHER_OWNER)));

        studentUser = new User();
        studentUser.setId(UUID.randomUUID());
        studentUser.setEmail("student@hoanobita.edu.vn");
        studentUser.setRoles(Set.of(new com.hoanobita.topikplatform.user.entity.Role(Enums.RoleName.STUDENT)));

        sampleNotification = new Notification();
        sampleNotification.setId(UUID.randomUUID());
        sampleNotification.setTitle("Test Notification");
        sampleNotification.setContent("Test Content");
        sampleNotification.setTargetType(TargetType.ALL);
        sampleNotification.setCreatedBy(teacherUser.getId());
        sampleNotification.setCreatedAt(Instant.now());
    }

    @Test
    void create_notificationAsTeacher_success() {
        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        NotificationRequest req = new NotificationRequest("New Test", "Content", TargetType.ALL, null);
        NotificationResponse result = notificationService.create(req);

        assertNotNull(result);
        assertEquals("New Test", result.title());
        verify(repo).save(any(Notification.class));
    }

    @Test
    void create_notificationAsStudent_throwsAccessDenied() {
        when(security.currentUser()).thenReturn(studentUser);

        NotificationRequest req = new NotificationRequest("Test", "Content", TargetType.ALL, null);
        assertThrows(Exception.class, () -> notificationService.create(req));
    }

    @Test
    void list_returnsPaginatedResult() {
        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.findAllOrderByCreatedAtDesc()).thenReturn(List.of(sampleNotification));
        when(readRepo.findByUserIdAndNotificationIds(any(), anyList())).thenReturn(List.of());

        PageResponse<NotificationResponse> result = notificationService.list(0, 10, null, null, null);

        assertNotNull(result);
        assertFalse(result.items().isEmpty());
        assertEquals("Test Notification", result.items().get(0).title());
    }

    @Test
    void unreadCount_returnsCorrectCount() {
        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.findAllOrderByCreatedAtDesc()).thenReturn(List.of(sampleNotification));
        when(readRepo.findByUserIdAndNotificationIds(any(), anyList())).thenReturn(List.of());

        long count = notificationService.unreadCount();

        assertEquals(1, count);
    }

    @Test
    void markAsRead_marksNotificationAsRead() {
        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.findById(sampleNotification.getId())).thenReturn(Optional.of(sampleNotification));
        when(readRepo.findByNotificationIdAndUserId(sampleNotification.getId(), teacherUser.getId()))
                .thenReturn(Optional.empty());
        when(readRepo.save(any(NotificationRead.class))).thenAnswer(inv -> inv.getArgument(0));
        when(permissions.getAccessibleClassIds(teacherUser)).thenReturn(List.of());

        NotificationResponse result = notificationService.markAsRead(sampleNotification.getId());

        assertNotNull(result);
        assertTrue(result.isRead());
        verify(readRepo).save(any(NotificationRead.class));
    }

    @Test
    void delete_notification_success() {
        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.findById(sampleNotification.getId())).thenReturn(Optional.of(sampleNotification));

        notificationService.delete(sampleNotification.getId());

        verify(repo).delete(sampleNotification);
    }

    @Test
    void delete_notificationByNonOwnerStudent_throwsForbidden() {
        when(security.currentUser()).thenReturn(studentUser);
        when(repo.findById(sampleNotification.getId())).thenReturn(Optional.of(sampleNotification));

        assertThrows(BusinessException.class, () ->
                notificationService.delete(sampleNotification.getId()));
    }

    @Test
    void markAllAsRead_marksMultipleNotifications() {
        Notification n2 = new Notification();
        n2.setId(UUID.randomUUID());
        n2.setTitle("Notification 2");
        n2.setTargetType(TargetType.ALL);

        when(security.currentUser()).thenReturn(teacherUser);
        when(repo.findAllOrderByCreatedAtDesc()).thenReturn(List.of(sampleNotification, n2));
        when(readRepo.findByUserIdAndNotificationIds(any(), anyList())).thenReturn(List.of());
        when(readRepo.save(any(NotificationRead.class))).thenAnswer(inv -> inv.getArgument(0));

        int count = notificationService.markAllAsRead();

        assertEquals(2, count);
        verify(readRepo, times(2)).save(any(NotificationRead.class));
    }
}
