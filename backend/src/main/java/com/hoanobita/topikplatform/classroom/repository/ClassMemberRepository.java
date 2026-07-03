package com.hoanobita.topikplatform.classroom.repository;

import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassMemberRepository extends JpaRepository<ClassMember, UUID> {

    List<ClassMember> findByClassIdAndStatus(UUID classId, MemberStatus status);

    @Query("SELECT cm.classId FROM ClassMember cm WHERE cm.studentId = :studentId AND cm.status = 'ACTIVE'")
    List<UUID> findClassIdsByStudentId(@Param("studentId") UUID studentId);

    boolean existsByClassIdAndStudentIdAndStatus(UUID classId, UUID studentId, MemberStatus status);

    Optional<ClassMember> findByClassIdAndStudentId(UUID classId, UUID studentId);

    boolean existsByClassIdAndStudentCode(UUID classId, String studentCode);

    long countByClassId(UUID classId);
}
