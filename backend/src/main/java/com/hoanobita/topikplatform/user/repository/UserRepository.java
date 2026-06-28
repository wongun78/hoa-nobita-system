package com.hoanobita.topikplatform.user.repository;

import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND (u.email = :identifier OR u.phone = :identifier)")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL")
    List<User> findAllActive();

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.id = :id")
    Optional<User> findActiveById(@Param("id") UUID id);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END FROM User u WHERE u.email = :email AND u.deletedAt IS NULL")
    boolean existsByEmail(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END FROM User u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    boolean existsByPhone(@Param("phone") String phone);

    Optional<User> findByEmail(String email);
}
