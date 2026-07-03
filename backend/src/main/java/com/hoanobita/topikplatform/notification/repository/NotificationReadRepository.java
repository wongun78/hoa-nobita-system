package com.hoanobita.topikplatform.notification.repository;

import com.hoanobita.topikplatform.notification.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, UUID> {

    Optional<NotificationRead> findByNotificationIdAndUserId(UUID notificationId, UUID userId);

    @Query("SELECT nr FROM NotificationRead nr WHERE nr.userId = :userId AND nr.notificationId IN :notificationIds")
    List<NotificationRead> findByUserIdAndNotificationIds(@Param("userId") UUID userId, @Param("notificationIds") List<UUID> notificationIds);
}
