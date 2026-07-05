package com.hoanobita.topikplatform.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;

/**
 * Utility for creating Spring Data {@link Pageable} from API params.
 * API uses 1-based page numbers; Spring Data uses 0-based internally.
 */
public final class PageableUtil {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PageableUtil() {
    }

    /**
     * Create a Pageable from API params with sort field whitelisting.
     *
     * @param page         1-based page number (null defaults to 1)
     * @param size         page size (null defaults to 20, max 100)
     * @param sort         "field,asc" or "field,desc" (null defaults to createdAt,desc)
     * @param allowedFields whitelist of sortable field names
     * @param defaultSort  fallback sort when sort param is null/invalid
     * @return Pageable for Spring Data repository methods
     */
    public static Pageable of(Integer page, Integer size, String sort,
                              Set<String> allowedFields, Sort defaultSort) {
        int p = normalizePage(page);
        int s = normalizeSize(size);
        Sort sortObj = resolveSort(sort, allowedFields, defaultSort);
        return PageRequest.of(p - 1, s, sortObj); // convert 1-based to 0-based
    }

    /**
     * Simple overload with default sort by createdAt desc.
     */
    public static Pageable of(Integer page, Integer size, Set<String> allowedFields) {
        return of(page, size, null, allowedFields, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    /**
     * Convert a Spring Data {@link Page} to our API {@link PageResponse}.
     */
    public static <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.of(
                page.getContent(),
                page.getNumber() + 1, // convert 0-based back to 1-based
                page.getSize(),
                page.getTotalElements()
        );
    }

    public static int normalizePage(Integer page) {
        return (page == null || page < 1) ? DEFAULT_PAGE : page;
    }

    public static int normalizeSize(Integer size) {
        if (size == null || size < 1) return DEFAULT_SIZE;
        return Math.min(size, MAX_SIZE);
    }

    private static Sort resolveSort(String sort, Set<String> allowedFields, Sort defaultSort) {
        if (sort == null || sort.isBlank()) return defaultSort;

        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());

        if (!allowedFields.contains(field)) {
            return defaultSort;
        }

        return desc ? Sort.by(Sort.Direction.DESC, field) : Sort.by(Sort.Direction.ASC, field);
    }

    /**
     * Paginate an in-memory list. Use only when DB-level pagination is not feasible
     * (e.g., cross-table filtering with read-status joins).
     */
    public static <T> PageResponse<T> paginateInMemory(List<T> items, int page, int size) {
        int totalItems = items.size();
        int fromIndex = Math.min((page - 1) * size, totalItems);
        int toIndex = Math.min(fromIndex + size, totalItems);
        List<T> pageItems = items.subList(fromIndex, toIndex);
        return PageResponse.of(pageItems, page, size, totalItems);
    }
}
