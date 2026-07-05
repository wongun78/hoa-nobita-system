package com.hoanobita.topikplatform.attendance.repository;

import com.hoanobita.topikplatform.attendance.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    @Query("SELECT a FROM Attendance a WHERE a.id = :id AND a.deletedAt IS NULL")
    Optional<Attendance> findActiveById(@Param("id") UUID id);

    @Query("SELECT a FROM Attendance a WHERE a.lessonId = :lessonId AND a.deletedAt IS NULL ORDER BY a.createdAt ASC")
    List<Attendance> findByLessonId(@Param("lessonId") UUID lessonId);

    @Query("SELECT a FROM Attendance a WHERE a.studentId = :studentId AND a.deletedAt IS NULL ORDER BY a.createdAt DESC")
    List<Attendance> findByStudentId(@Param("studentId") UUID studentId);

    @Query(value = "SELECT a FROM Attendance a WHERE a.studentId = :studentId AND a.deletedAt IS NULL",
           countQuery = "SELECT COUNT(a) FROM Attendance a WHERE a.studentId = :studentId AND a.deletedAt IS NULL")
    Page<Attendance> findByStudentIdPaged(@Param("studentId") UUID studentId, Pageable pageable);

    @Query("SELECT a FROM Attendance a WHERE a.lessonId IN :lessonIds AND a.deletedAt IS NULL")
    List<Attendance> findByLessonIdIn(@Param("lessonIds") List<UUID> lessonIds);

    @Query("SELECT a FROM Attendance a WHERE a.lessonId = :lessonId AND a.studentId = :studentId AND a.deletedAt IS NULL")
    Optional<Attendance> findByLessonIdAndStudentId(@Param("lessonId") UUID lessonId, @Param("studentId") UUID studentId);
}
