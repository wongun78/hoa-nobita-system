package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Central permission checking service.
 * All class-level permission checks go through here.
 */
@Service
public class PermissionService {

    private final ClassAdminRepository classAdminRepo;
    private final ClassMemberRepository classMemberRepo;

    public PermissionService(ClassAdminRepository classAdminRepo, ClassMemberRepository classMemberRepo) {
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
    }

    /** Check if user can manage (create/edit/delete) content in a class */
    public boolean canManageClass(User user, UUID classId) {
        if (user.isTeacher()) return true;
        if (user.isAdmin()) return classAdminRepo.existsByClassIdAndAdminId(classId, user.getId());
        return false;
    }

    /** Check if user can view content of a class */
    public boolean canAccessClass(User user, UUID classId) {
        if (user.isTeacher()) return true;
        if (user.isAdmin()) return classAdminRepo.existsByClassIdAndAdminId(classId, user.getId());
        if (user.isStudent()) return classMemberRepo.existsByClassIdAndStudentIdAndStatus(classId, user.getId(), MemberStatus.ACTIVE);
        return false;
    }

    /** Check if student is an active member of a class */
    public boolean isClassMember(UUID classId, UUID studentId) {
        return classMemberRepo.existsByClassIdAndStudentIdAndStatus(classId, studentId, MemberStatus.ACTIVE);
    }

    /** Check if user is assigned admin of a class */
    public boolean isClassAdmin(UUID classId, UUID adminId) {
        return classAdminRepo.existsByClassIdAndAdminId(classId, adminId);
    }

    /** Check if admin can access a student's progress (student must be in at least one of admin's classes) */
    public boolean canAccessStudentProgress(User admin, UUID studentId) {
        if (admin.isTeacher()) return true;
        if (!admin.isAdmin()) return false;
        
        List<UUID> adminClassIds = classAdminRepo.findClassIdsByAdminId(admin.getId());
        if (adminClassIds.isEmpty()) return false;
        
        List<UUID> studentClassIds = classMemberRepo.findClassIdsByStudentId(studentId);
        
        // Check for intersection
        for (UUID classId : studentClassIds) {
            if (adminClassIds.contains(classId)) {
                return true;
            }
        }
        return false;
    }

    /** Get all class IDs accessible to user */
    public List<UUID> getAccessibleClassIds(User user) {
        if (user.isTeacher()) return null; // null means all
        if (user.isAdmin()) return classAdminRepo.findClassIdsByAdminId(user.getId());
        if (user.isStudent()) return classMemberRepo.findClassIdsByStudentId(user.getId());
        return List.of();
    }

    /** Require manage access or throw */
    public void requireManageClass(User user, UUID classId) {
        if (!canManageClass(user, classId)) {
            throw BusinessException.forbidden("You do not have permission to manage this class");
        }
    }

    /** Require access or throw */
    public void requireAccessClass(User user, UUID classId) {
        if (!canAccessClass(user, classId)) {
            throw BusinessException.forbidden("You do not have permission to access this class");
        }
    }

    /** Require teacher role */
    public void requireTeacher(User user) {
        if (!user.isTeacher()) {
            throw BusinessException.forbidden("Only teacher can perform this action");
        }
    }

    /** Require teacher or admin role */
    public void requireTeacherOrAdmin(User user) {
        if (!user.isTeacher() && !user.isAdmin()) {
            throw BusinessException.forbidden("Only teacher or admin can perform this action");
        }
    }
}
