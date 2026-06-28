package com.hoanobita.topikplatform.classroom.repository;

import com.hoanobita.topikplatform.classroom.entity.ClassAdmin;
import com.hoanobita.topikplatform.classroom.entity.ClassAdminId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ClassAdminRepository extends JpaRepository<ClassAdmin, ClassAdminId> {

    List<ClassAdmin> findByClassId(UUID classId);

    @Query("SELECT ca.classId FROM ClassAdmin ca WHERE ca.adminId = :adminId")
    List<UUID> findClassIdsByAdminId(@Param("adminId") UUID adminId);

    boolean existsByClassIdAndAdminId(UUID classId, UUID adminId);

    void deleteByClassIdAndAdminId(UUID classId, UUID adminId);
}
