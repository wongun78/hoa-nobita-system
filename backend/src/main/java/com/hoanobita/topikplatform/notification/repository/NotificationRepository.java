package com.hoanobita.topikplatform.notification.repository;

import com.hoanobita.topikplatform.notification.entity.Notification;
import com.hoanobita.topikplatform.common.Enums.TargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n ORDER BY n.createdAt DESC")
    List<Notification> findAllOrderByCreatedAtDesc();

    @Query("SELECT n FROM Notification n WHERE n.targetType = 'ALL' OR " +
           "(n.targetType = 'USER' AND n.targetId = :userId) OR " +
           "(n.targetType = 'CLASS' AND n.targetId IN :classIds) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("userId") UUID userId, @Param("classIds") List<UUID> classIds);

        @Query("SELECT n FROM Notification n WHERE n.targetType = 'ALL' OR " +
            "(n.targetType = 'USER' AND n.targetId = :userId) " +
            "ORDER BY n.createdAt DESC")
        List<Notification> findForUserWithoutClass(@Param("userId") UUID userId);

    @Query("SELECT n FROM Notification n")
    List<Notification> findAllActive();
}
