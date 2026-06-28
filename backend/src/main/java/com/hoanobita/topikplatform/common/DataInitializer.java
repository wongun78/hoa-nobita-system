package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.classroom.entity.ClassAdmin;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.RoleRepository;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class DataInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final KlassRepository classes;
    private final ClassAdminRepository admins;
    private final ClassMemberRepository members;
    private final PasswordEncoder encoder;

    public DataInitializer(UserRepository users, RoleRepository roles, KlassRepository classes, ClassAdminRepository admins, ClassMemberRepository members, PasswordEncoder encoder) {
        this.users = users;
        this.roles = roles;
        this.classes = classes;
        this.admins = admins;
        this.members = members;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role teacherRole = role(RoleName.TEACHER_OWNER);
        Role adminRole = role(RoleName.CLASS_ADMIN);
        Role studentRole = role(RoleName.STUDENT);
        User teacher = user("Anh Hoà", "teacher@hoanobita.com", "0900000001", teacherRole);
        User admin = user("Quản lý lớp", "admin@hoanobita.com", "0900000002", adminRole);
        User student1 = user("Nguyễn Minh An", "student1@hoanobita.com", "0900000003", studentRole);
        user("Trần Hà My", "student2@hoanobita.com", "0900000004", studentRole);
        Klass klass = classes.findAllActive().stream().filter(k -> "TOPIK34-A".equals(k.getCode())).findFirst().orElseGet(() -> {
            Klass k = new Klass();
            k.setName("TOPIK 3-4 Intensive");
            k.setCode("TOPIK34-A");
            k.setDescription("Lớp luyện thi TOPIK II chuyên sâu cho trình độ 3-4.");
            k.setLevelFrom(3);
            k.setLevelTo(4);
            k.setStatus(ClassStatus.ACTIVE);
            k.setTeacherId(teacher.getId());
            return classes.save(k);
        });
        if (!admins.existsByClassIdAndAdminId(klass.getId(), admin.getId())) admins.save(new ClassAdmin(klass.getId(), admin.getId()));
        if (!members.existsByClassIdAndStudentIdAndStatus(klass.getId(), student1.getId(), MemberStatus.ACTIVE)) {
            ClassMember m = new ClassMember();
            m.setClassId(klass.getId());
            m.setStudentId(student1.getId());
            m.setStatus(MemberStatus.ACTIVE);
            members.save(m);
        }
    }

    private Role role(RoleName name) {
        return roles.findByName(name).orElseGet(() -> {
            Role r = new Role();
            r.setName(name);
            return roles.save(r);
        });
    }

    private User user(String fullName, String email, String phone, Role role) {
        return users.findByEmailOrPhone(email).orElseGet(() -> {
            User u = new User();
            u.setFullName(fullName);
            u.setEmail(email);
            u.setPhone(phone);
            u.setPasswordHash(encoder.encode("Password123!"));
            u.setStatus(UserStatus.ACTIVE);
            u.setFirstLogin(false);
            u.setRoles(Set.of(role));
            return users.save(u);
        });
    }
}
