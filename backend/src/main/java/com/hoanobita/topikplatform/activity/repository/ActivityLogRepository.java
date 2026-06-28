package com.hoanobita.topikplatform.activity.repository;

import com.hoanobita.topikplatform.activity.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    List<ActivityLog> findTop50ByOrderByCreatedAtDesc();

    @Query("SELECT a FROM ActivityLog a WHERE a.classId IN :classIds ORDER BY a.createdAt DESC LIMIT 50")
    List<ActivityLog> findRecentByClassIds(@Param("classIds") List<UUID> classIds);

    List<ActivityLog> findTop50ByClassIdOrderByCreatedAtDesc(UUID classId);
}
