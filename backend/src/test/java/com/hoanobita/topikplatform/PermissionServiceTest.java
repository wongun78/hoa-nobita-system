package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock private ClassAdminRepository classAdminRepo;
    @Mock private ClassMemberRepository classMemberRepo;

    @InjectMocks
    private PermissionService permissionService;

    private User teacher;
    private User admin;
    private User student;
    private UUID classId;

    @BeforeEach
    void setUp() {
        classId = UUID.randomUUID();

        teacher = createUser(RoleName.TEACHER_OWNER);
        admin = createUser(RoleName.CLASS_ADMIN);
        student = createUser(RoleName.STUDENT);
    }

    // --- requireTeacher ---

    @Test
    void requireTeacher_teacherPasses() {
        assertDoesNotThrow(() -> permissionService.requireTeacher(teacher));
    }

    @Test
    void requireTeacher_adminThrows() {
        assertThrows(Exception.class, () -> permissionService.requireTeacher(admin));
    }

    @Test
    void requireTeacher_studentThrows() {
        assertThrows(Exception.class, () -> permissionService.requireTeacher(student));
    }

    // --- requireTeacherOrAdmin ---

    @Test
    void requireTeacherOrAdmin_teacherPasses() {
        assertDoesNotThrow(() -> permissionService.requireTeacherOrAdmin(teacher));
    }

    @Test
    void requireTeacherOrAdmin_adminPasses() {
        assertDoesNotThrow(() -> permissionService.requireTeacherOrAdmin(admin));
    }

    @Test
    void requireTeacherOrAdmin_studentThrows() {
        assertThrows(Exception.class, () -> permissionService.requireTeacherOrAdmin(student));
    }

    // --- canManageClass ---

    @Test
    void canManageClass_teacherAlwaysTrue() {
        assertTrue(permissionService.canManageClass(teacher, classId));
    }

    @Test
    void canManageClass_adminAlwaysTrue() {
        assertTrue(permissionService.canManageClass(admin, classId));
    }

    @Test
    void canManageClass_adminWithoutAssignment_true() {
        assertTrue(permissionService.canManageClass(admin, classId));
    }

    @Test
    void canManageClass_studentAlwaysFalse() {
        assertFalse(permissionService.canManageClass(student, classId));
    }

    // --- canAccessClass ---

    @Test
    void canAccessClass_teacherAlwaysTrue() {
        assertTrue(permissionService.canAccessClass(teacher, classId));
    }

    @Test
    void canAccessClass_adminAlwaysTrue() {
        assertTrue(permissionService.canAccessClass(admin, classId));
    }

    @Test
    void canAccessClass_studentAsMember_true() {
        when(classMemberRepo.existsByClassIdAndStudentIdAndStatus(classId, student.getId(), MemberStatus.ACTIVE))
                .thenReturn(true);
        assertTrue(permissionService.canAccessClass(student, classId));
    }

    @Test
    void canAccessClass_studentNotMember_false() {
        when(classMemberRepo.existsByClassIdAndStudentIdAndStatus(classId, student.getId(), MemberStatus.ACTIVE))
                .thenReturn(false);
        assertFalse(permissionService.canAccessClass(student, classId));
    }

    // --- getAccessibleClassIds ---

    @Test
    void getAccessibleClassIds_teacher_returnsNullForAll() {
        assertNull(permissionService.getAccessibleClassIds(teacher));
    }

    @Test
    void getAccessibleClassIds_admin_returnsNullForAll() {
        assertNull(permissionService.getAccessibleClassIds(admin));
    }

    @Test
    void getAccessibleClassIds_student_returnsEnrolledClasses() {
        List<UUID> studentClasses = List.of(UUID.randomUUID());
        when(classMemberRepo.findClassIdsByStudentId(student.getId())).thenReturn(studentClasses);
        assertEquals(studentClasses, permissionService.getAccessibleClassIds(student));
    }

    // --- canAccessStudentProgress ---

    @Test
    void canAccessStudentProgress_teacherAlwaysTrue() {
        assertTrue(permissionService.canAccessStudentProgress(teacher, UUID.randomUUID()));
    }

    @Test
    void canAccessStudentProgress_adminAlwaysTrue() {
        assertTrue(permissionService.canAccessStudentProgress(admin, UUID.randomUUID()));
    }

    @Test
    void canAccessStudentProgress_adminNoSharedClass_true() {
        assertTrue(permissionService.canAccessStudentProgress(admin, UUID.randomUUID()));
    }

    @Test
    void canAccessStudentProgress_studentAlwaysFalse() {
        assertFalse(permissionService.canAccessStudentProgress(student, UUID.randomUUID()));
    }

    private User createUser(RoleName roleName) {
        Role role = new Role(roleName);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName(roleName + " User");
        user.setEmail(roleName.name().toLowerCase() + "@test.com");
        user.setRoles(Set.of(role));
        return user;
    }
}
