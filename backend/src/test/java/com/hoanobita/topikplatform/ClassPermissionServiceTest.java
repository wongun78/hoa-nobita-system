package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import org.junit.jupiter.api.Test;
import java.util.Set;
import static org.junit.jupiter.api.Assertions.*;

class ClassPermissionServiceTest {
    @Test void roleHelpersDetectTeacherAdminStudent() {
        Role teacher = new Role(); teacher.setName(RoleName.TEACHER_OWNER);
        User user = new User(); user.setRoles(Set.of(teacher));
        assertTrue(user.isTeacher());
        assertFalse(user.isStudent());
    }
}
