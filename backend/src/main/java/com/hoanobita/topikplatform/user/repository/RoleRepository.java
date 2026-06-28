package com.hoanobita.topikplatform.user.repository;

import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(RoleName name);
}
