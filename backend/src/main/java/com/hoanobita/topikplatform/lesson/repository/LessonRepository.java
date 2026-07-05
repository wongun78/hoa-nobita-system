package com.hoanobita.topikplatform.lesson.repository;

import com.hoanobita.topikplatform.lesson.entity.Lesson;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID>, JpaSpecificationExecutor<Lesson> {

    @Query("SELECT l FROM Lesson l WHERE l.classId = :classId AND l.deletedAt IS NULL ORDER BY l.orderIndex")
    List<Lesson> findByClassId(@Param("classId") UUID classId);

    @Query("SELECT l FROM Lesson l WHERE l.classId = :classId AND l.deletedAt IS NULL")
    Page<Lesson> findByClassId(@Param("classId") UUID classId, Pageable pageable);

    @Query("SELECT l FROM Lesson l WHERE l.classId = :classId AND l.status = 'PUBLISHED' AND l.deletedAt IS NULL")
    Page<Lesson> findVisibleByClassId(@Param("classId") UUID classId, Pageable pageable);

    @Query("SELECT l FROM Lesson l WHERE l.deletedAt IS NULL")
    List<Lesson> findAllActive();

    @Query("SELECT l FROM Lesson l WHERE l.classId IN :classIds AND l.deletedAt IS NULL")
    List<Lesson> findByClassIdIn(@Param("classIds") List<UUID> classIds);

    @Query("SELECT l FROM Lesson l WHERE l.id = :id AND l.deletedAt IS NULL")
    Optional<Lesson> findActiveById(@Param("id") UUID id);
}
