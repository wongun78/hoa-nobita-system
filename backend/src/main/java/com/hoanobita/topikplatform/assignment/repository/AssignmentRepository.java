package com.hoanobita.topikplatform.assignment.repository;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    @Query("SELECT a FROM Assignment a WHERE a.classId = :classId AND a.deletedAt IS NULL")
    List<Assignment> findByClassId(@Param("classId") UUID classId);

    @Query("SELECT a FROM Assignment a WHERE a.classId = :classId AND a.status IN :statuses AND a.deletedAt IS NULL")
    List<Assignment> findByClassIdAndStatusIn(@Param("classId") UUID classId, @Param("statuses") List<AssignmentStatus> statuses);

    @Query("SELECT a FROM Assignment a WHERE a.id = :id AND a.deletedAt IS NULL")
    Optional<Assignment> findActiveById(@Param("id") UUID id);

    @Query("SELECT a FROM Assignment a WHERE a.classId IN :classIds AND a.deletedAt IS NULL")
    List<Assignment> findByClassIdIn(@Param("classIds") List<UUID> classIds);

    @Query("SELECT a FROM Assignment a WHERE a.classId IN :classIds AND a.status IN :statuses AND a.deletedAt IS NULL")
    List<Assignment> findByClassIdInAndStatusIn(@Param("classIds") List<UUID> classIds, @Param("statuses") List<AssignmentStatus> statuses);

    @Query("SELECT a FROM Assignment a WHERE a.deletedAt IS NULL")
    List<Assignment> findAllActive();
}
