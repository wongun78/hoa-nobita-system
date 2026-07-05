package com.hoanobita.topikplatform.material.repository;

import com.hoanobita.topikplatform.material.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID>, JpaSpecificationExecutor<Material> {

    @Query("SELECT m FROM Material m WHERE m.classId = :classId AND m.deletedAt IS NULL")
    List<Material> findByClassId(@Param("classId") UUID classId);

    @Query("SELECT m FROM Material m WHERE m.classId = :classId AND m.deletedAt IS NULL")
    Page<Material> findByClassId(@Param("classId") UUID classId, Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.classId = :classId AND m.visible = true AND m.deletedAt IS NULL")
    List<Material> findVisibleByClassId(@Param("classId") UUID classId);

    @Query("SELECT m FROM Material m WHERE m.classId = :classId AND m.visible = true AND m.deletedAt IS NULL")
    Page<Material> findVisibleByClassId(@Param("classId") UUID classId, Pageable pageable);

    @Query("SELECT m FROM Material m WHERE m.id = :id AND m.deletedAt IS NULL")
    Optional<Material> findActiveById(@Param("id") UUID id);

    @Query("SELECT m FROM Material m WHERE m.deletedAt IS NULL")
    List<Material> findAllActive();
}
