package com.hoanobita.topikplatform.lesson;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.LessonStatus;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.lesson.dto.*;
import com.hoanobita.topikplatform.lesson.entity.Lesson;
import com.hoanobita.topikplatform.lesson.repository.LessonRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;
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
        permissionService.requireAccessClass(user, classId);

        Pageable pageable = PageableUtil.of(page, size, sort,
                Set.of("createdAt", "title", "lessonDate", "orderIndex", "status"),
                Sort.by(Sort.Direction.ASC, "orderIndex"));

        Page<Lesson> lessonPage;
        if (user.isStudent()) {
            lessonPage = lessonRepo.findVisibleByClassId(classId, pageable);
        } else {
            lessonPage = lessonRepo.findByClassId(classId, pageable);
        }
        return PageableUtil.toPageResponse(lessonPage.map(this::toResponse));
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
            catch (IllegalArgumentException e) { throw BusinessException.badRequest("Trạng thái không hợp lệ"); }
        }

        lesson = lessonRepo.save(lesson);
        activityService.log("LESSON_CREATED", "LESSON", lesson.getId(), lesson.getTitle(), classId, "Đã tạo bài học mới: " + lesson.getTitle());
        return toResponse(lesson);
    }

    public LessonResponse getById(UUID lessonId, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy buổi học"));
        permissionService.requireAccessClass(user, lesson.getClassId());
        return toResponse(lesson);
    }

    @Transactional
    public LessonResponse update(UUID lessonId, LessonRequest request, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy buổi học"));
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
            catch (IllegalArgumentException e) { throw BusinessException.badRequest("Trạng thái không hợp lệ"); }
        }
        lesson.setUpdatedBy(user.getId());

        lesson = lessonRepo.save(lesson);
        activityService.log("LESSON_UPDATED", "LESSON", lesson.getId(), lesson.getTitle(), lesson.getClassId(), "Đã cập nhật bài học: " + lesson.getTitle());
        return toResponse(lesson);
    }

    @Transactional
    public void delete(UUID lessonId, User user) {
        var lesson = lessonRepo.findActiveById(lessonId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy buổi học"));
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

}
