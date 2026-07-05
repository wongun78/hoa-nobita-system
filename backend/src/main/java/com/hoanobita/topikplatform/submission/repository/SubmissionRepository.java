package com.hoanobita.topikplatform.submission.repository;

import com.hoanobita.topikplatform.submission.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID>, JpaSpecificationExecutor<Submission> {

    @Query("SELECT s FROM Submission s WHERE s.assignmentId = :assignmentId AND s.deletedAt IS NULL")
    List<Submission> findByAssignmentId(@Param("assignmentId") UUID assignmentId);

    @Query("SELECT s FROM Submission s WHERE s.assignmentId = :assignmentId AND s.deletedAt IS NULL")
    Page<Submission> findByAssignmentId(@Param("assignmentId") UUID assignmentId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.studentId = :studentId AND s.deletedAt IS NULL")
    List<Submission> findByStudentId(@Param("studentId") UUID studentId);

    @Query("SELECT s FROM Submission s WHERE s.studentId = :studentId AND s.deletedAt IS NULL")
    Page<Submission> findByStudentId(@Param("studentId") UUID studentId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.assignmentId = :assignmentId AND s.studentId = :studentId AND s.deletedAt IS NULL")
    Optional<Submission> findByAssignmentIdAndStudentId(@Param("assignmentId") UUID assignmentId, @Param("studentId") UUID studentId);

    @Query("SELECT s FROM Submission s WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<Submission> findActiveById(@Param("id") UUID id);

    @Query("SELECT s FROM Submission s WHERE s.assignmentId IN :assignmentIds AND s.deletedAt IS NULL")
    List<Submission> findByAssignmentIdIn(@Param("assignmentIds") List<UUID> assignmentIds);

    @Query("SELECT s FROM Submission s WHERE s.deletedAt IS NULL")
    List<Submission> findAllActive();
}
