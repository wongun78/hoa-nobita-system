package com.hoanobita.topikplatform.classroom.repository;

import com.hoanobita.topikplatform.classroom.entity.Klass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KlassRepository extends JpaRepository<Klass, UUID> {

    @Query("SELECT k FROM Klass k WHERE k.deletedAt IS NULL")
    List<Klass> findAllActive();

    @Query("SELECT k FROM Klass k WHERE k.id = :id AND k.deletedAt IS NULL")
    Optional<Klass> findActiveById(@Param("id") UUID id);

    @Query("SELECT CASE WHEN COUNT(k) > 0 THEN TRUE ELSE FALSE END FROM Klass k WHERE k.code = :code AND k.deletedAt IS NULL")
    boolean existsByCode(@Param("code") String code);

    @Query("SELECT k FROM Klass k WHERE k.deletedAt IS NULL AND k.teacherId = :teacherId")
    List<Klass> findByTeacherId(@Param("teacherId") UUID teacherId);
}
