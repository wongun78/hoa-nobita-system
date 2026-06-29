package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
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
    private final PasswordEncoder encoder;

    public DataInitializer(UserRepository users, RoleRepository roles, PasswordEncoder encoder) {
        this.users = users;
        this.roles = roles;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role teacherRole = role(RoleName.TEACHER_OWNER);
        role(RoleName.CLASS_ADMIN);
        role(RoleName.STUDENT);
        user("Anh Hoà", "teacher@hoanobita.com", "0900000001", teacherRole);
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
