package com.hoanobita.topikplatform.grading.repository;

import com.hoanobita.topikplatform.grading.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GradeRepository extends JpaRepository<Grade, UUID> {
    Optional<Grade> findBySubmissionId(UUID submissionId);

    @Query("SELECT g FROM Grade g WHERE g.submissionId IN (SELECT s.id FROM Submission s WHERE s.assignmentId = :assignmentId AND s.deletedAt IS NULL)")
    List<Grade> findByAssignmentId(@Param("assignmentId") UUID assignmentId);

    @Query("SELECT g FROM Grade g WHERE g.submissionId IN (SELECT s.id FROM Submission s WHERE s.assignmentId IN :assignmentIds AND s.deletedAt IS NULL)")
    List<Grade> findByAssignmentIds(@Param("assignmentIds") List<UUID> assignmentIds);

    @Query("SELECT g FROM Grade g WHERE g.submissionId IN (SELECT s.id FROM Submission s WHERE s.studentId = :studentId AND s.deletedAt IS NULL)")
    List<Grade> findByStudentId(@Param("studentId") UUID studentId);

    @Query("SELECT g FROM Grade g WHERE g.submissionId = :submissionId")
    List<Grade> findBySubmissionIdList(@Param("submissionId") UUID submissionId);

    @Query("SELECT g FROM Grade g WHERE g.submissionId IN (SELECT s.id FROM Submission s WHERE s.assignmentId IN :assignmentIds AND s.deletedAt IS NULL)")
    List<Grade> findActiveByAssignmentIds(@Param("assignmentIds") List<UUID> assignmentIds);

    @Query("SELECT g FROM Grade g WHERE g.submissionId IN (SELECT s.id FROM Submission s WHERE s.deletedAt IS NULL)")
    List<Grade> findAllActive();
}
