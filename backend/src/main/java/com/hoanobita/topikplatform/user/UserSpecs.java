package com.hoanobita.topikplatform.user;

import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specifications for dynamic User queries.
 * All specs respect soft-delete (deletedAt IS NULL).
 */
public final class UserSpecs {

    private UserSpecs() {
    }

    /** Base filter: only non-deleted users. */
    public static Specification<User> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    /** Filter by status (ACTIVE, INACTIVE, SUSPENDED). Null = no filter. */
    public static Specification<User> hasStatus(String status) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(status)) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    /** Filter by role name (TEACHER_OWNER, CLASS_ADMIN, STUDENT). Null = no filter. */
    public static Specification<User> hasRole(String role) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(role)) return cb.conjunction();
            Join<User, Role> roleJoin = root.join("roles", JoinType.LEFT);
            return cb.equal(roleJoin.get("name"), role);
        };
    }

    /** Full-text search on fullName, email, phone. Null/blank = no filter. */
    public static Specification<User> search(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) return cb.conjunction();
            String pattern = "%" + keyword.toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("fullName")), pattern));
            predicates.add(cb.like(cb.lower(root.get("email")), pattern));
            predicates.add(cb.like(cb.lower(root.get("phone")), pattern));
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }
}
