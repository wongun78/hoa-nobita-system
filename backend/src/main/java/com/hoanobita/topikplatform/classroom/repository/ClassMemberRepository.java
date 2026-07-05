package com.hoanobita.topikplatform.classroom.repository;

import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassMemberRepository extends JpaRepository<ClassMember, UUID>, JpaSpecificationExecutor<ClassMember> {

    List<ClassMember> findByClassIdAndStatus(UUID classId, MemberStatus status);

    @Query("SELECT cm FROM ClassMember cm JOIN FETCH User u ON u.id = cm.studentId "
            + "WHERE cm.classId = :classId AND cm.status = 'ACTIVE' AND u.deletedAt IS NULL")
    Page<ClassMember> findActiveByClassIdWithUser(@Param("classId") UUID classId, Pageable pageable);

    @Query("SELECT cm.classId FROM ClassMember cm WHERE cm.studentId = :studentId AND cm.status = 'ACTIVE'")
    List<UUID> findClassIdsByStudentId(@Param("studentId") UUID studentId);

    boolean existsByClassIdAndStudentIdAndStatus(UUID classId, UUID studentId, MemberStatus status);

    Optional<ClassMember> findByClassIdAndStudentId(UUID classId, UUID studentId);

    boolean existsByClassIdAndStudentCode(UUID classId, String studentCode);

    long countByClassId(UUID classId);

    @Query("SELECT cm.classId, COUNT(cm) FROM ClassMember cm WHERE cm.status = 'ACTIVE' GROUP BY cm.classId")
    List<Object[]> countActiveByClassIdGrouped();

    @Query("SELECT DISTINCT cm.studentId FROM ClassMember cm WHERE cm.status = 'ACTIVE'")
    List<UUID> findStudentIdsWithActiveMembership();
}
