package com.hoanobita.topikplatform.lesson;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.LessonStatus;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PaginationUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.lesson.dto.*;
import com.hoanobita.topikplatform.lesson.entity.Lesson;
import com.hoanobita.topikplatform.lesson.repository.LessonRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LessonService {

    private final LessonRepository lessonRepo;
    private final PermissionService permissionService;
    private final ActivityService activityService;

    public LessonService(LessonRepository lessonRepo, PermissionService permissionService, ActivityService activityService) {
        this.lessonRepo = lessonRepo;
        this.permissionService = permissionService;
        this.activityService = activityService;
    }

    public PageResponse<LessonResponse> listByClass(UUID classId, User user, Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PaginationUtil.normalizePage(page);
        int normalizedSize = PaginationUtil.normalizeSize(size);

        permissionService.requireAccessClass(user, classId);
        var lessons = lessonRepo.findByClassId(classId);
        // Students only see published lessons
        if (user.isStudent()) {
            lessons = lessons.stream().filter(l -> l.getStatus() == LessonStatus.PUBLISHED).toList();
        }

        List<LessonResponse> filtered = lessons.stream()
                .map(this::toResponse)
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.title(), keyword)
                            || containsIgnoreCase(item.description(), keyword);
                })
                .toList();

        Comparator<LessonResponse> defaultSort = Comparator.comparing(LessonResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        Comparator<LessonResponse> comparator = PaginationUtil.resolveSort(sort, Map.of(
                "createdAt", Comparator.comparing(LessonResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())),
                "title", Comparator.comparing(LessonResponse::title, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "lessonDate", Comparator.comparing(LessonResponse::lessonDate, Comparator.nullsLast(Comparator.naturalOrder())),
                "orderIndex", Comparator.comparingInt(LessonResponse::orderIndex),
                "status", Comparator.comparing(LessonResponse::status, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        ), defaultSort);

        List<LessonResponse> sorted = filtered.stream().sorted(comparator).toList();
        return PaginationUtil.paginate(sorted, normalizedPage, normalizedSize);
    }

    @Transactional
    public LessonResponse create(UUID classId, LessonRequest request, User user) {
        permissionService.requireManageClass(user, classId);

        var lesson = new Lesson();
        lesson.setClassId(classId);
        lesson.setDescription(request.description());
        lesson.setOrderIndex(request.orderIndex() != null ? request.orderIndex() : 0);
        lesson.setCreatedBy(user.getId());
        LocalDate parsedDate = request.lessonDate() != null && !request.lessonDate().isBlank() ? LocalDate.parse(request.lessonDate()) : null;
        lesson.setLessonDate(parsedDate);
        if (request.title() != null && !request.title().isBlank()) {
            lesson.setTitle(request.title());
        } else if (parsedDate != null) {
            lesson.setTitle("Buổi học %s".formatted(parsedDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
        } else {
            lesson.setTitle("Buổi học");
        }
        if (request.status() != null) {
            try { lesson.setStatus(LessonStatus.valueOf(request.status())); }
            catch (IllegalArgumentException e) { throw BusinessException.badRequest("Invalid status"); }
        }

        lesson = lessonRepo.save(lesson);
        activityService.log("LESSON_CREATED", "LESSON", lesson.getId(), lesson.getTitle(), classId, "Đã tạo bài học mới: " + lesson.getTitle());
        return toResponse(lesson);
    }

    public LessonResponse getById(UUID lessonId, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        permissionService.requireAccessClass(user, lesson.getClassId());
        return toResponse(lesson);
    }

    @Transactional
    public LessonResponse update(UUID lessonId, LessonRequest request, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        permissionService.requireManageClass(user, lesson.getClassId());

        if (request.title() != null && !request.title().isBlank()) lesson.setTitle(request.title());
        if (request.description() != null) lesson.setDescription(request.description());
        if (request.orderIndex() != null) lesson.setOrderIndex(request.orderIndex());
        if (request.lessonDate() != null && !request.lessonDate().isBlank()) {
            LocalDate parsedDate = LocalDate.parse(request.lessonDate());
            lesson.setLessonDate(parsedDate);
            if (request.title() != null && request.title().isBlank()) {
                lesson.setTitle("Buổi học %s".formatted(parsedDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }
        }
        if (request.status() != null) {
            try { lesson.setStatus(LessonStatus.valueOf(request.status())); }
            catch (IllegalArgumentException e) { throw BusinessException.badRequest("Invalid status"); }
        }
        lesson.setUpdatedBy(user.getId());

        lesson = lessonRepo.save(lesson);
        activityService.log("LESSON_UPDATED", "LESSON", lesson.getId(), lesson.getTitle(), lesson.getClassId(), "Đã cập nhật bài học: " + lesson.getTitle());
        return toResponse(lesson);
    }

    @Transactional
    public void delete(UUID lessonId, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Lesson not found"));
        permissionService.requireManageClass(user, lesson.getClassId());
        lesson.softDelete();
        lessonRepo.save(lesson);
        activityService.log("LESSON_DELETED", "LESSON", lesson.getId(), lesson.getTitle(), lesson.getClassId(), "Đã xóa bài học: " + lesson.getTitle());
    }

    private LessonResponse toResponse(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(), lesson.getClassId(), lesson.getTitle(),
                lesson.getDescription(), lesson.getLessonDate(),
                lesson.getOrderIndex() != null ? lesson.getOrderIndex() : 0,
                lesson.getStatus().name(), lesson.getCreatedAt()
        );
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
