package com.hoanobita.topikplatform.common;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Shared helper for applying page/size/sort/search query params on in-memory lists
 * and wrapping the result in {@link PageResponse}.
 */
public final class PaginationUtil {

    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PaginationUtil() {
    }

    public static int normalizePage(Integer page) {
        return (page == null || page < 1) ? DEFAULT_PAGE : page;
    }

    public static int normalizeSize(Integer size) {
        if (size == null || size < 1) return DEFAULT_SIZE;
        return Math.min(size, MAX_SIZE);
    }

    /**
     * Parses a "field,asc" or "field,desc" sort param against the supplied field->comparator map.
     * Falls back to defaultComparator when sort is null/blank or the field is unknown.
     */
    public static <T> Comparator<T> resolveSort(String sort, Map<String, Comparator<T>> sortFields, Comparator<T> defaultComparator) {
        if (sort == null || sort.isBlank()) return defaultComparator;
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Comparator<T> comparator = sortFields.get(field);
        if (comparator == null) return defaultComparator;
        return desc ? comparator.reversed() : comparator;
    }

    /** Slice a fully-filtered/sorted list into the requested page. */
    public static <T> PageResponse<T> paginate(List<T> items, int page, int size) {
        int totalItems = items.size();
        int fromIndex = Math.min((page - 1) * size, totalItems);
        int toIndex = Math.min(fromIndex + size, totalItems);
        List<T> pageItems = items.subList(fromIndex, toIndex);
        return PageResponse.of(pageItems, page, size, totalItems);
    }
}
