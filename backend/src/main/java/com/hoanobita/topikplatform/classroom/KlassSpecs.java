package com.hoanobita.topikplatform.classroom;

import com.hoanobita.topikplatform.classroom.entity.Klass;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * JPA Specifications for dynamic Klass queries.
 */
public final class KlassSpecs {

    private KlassSpecs() {
    }

    public static Specification<Klass> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<Klass> hasStatus(String status) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(status)) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Klass> search(String keyword) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(keyword)) return cb.conjunction();
            String pattern = "%" + keyword.toLowerCase() + "%";
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            predicates.add(cb.like(cb.lower(root.get("code")), pattern));
            predicates.add(cb.like(cb.lower(root.get("description")), pattern));
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Klass> idIn(Collection<UUID> ids) {
        return (root, query, cb) -> {
            if (ids == null || ids.isEmpty()) return cb.disjunction(); // no results
            return root.get("id").in(ids);
        };
    }
}
