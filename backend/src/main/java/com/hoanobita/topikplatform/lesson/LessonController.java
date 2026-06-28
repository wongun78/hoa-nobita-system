package com.hoanobita.topikplatform.lesson;

import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.lesson.dto.LessonRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class LessonController {

    private final LessonService lessonService;
    private final SecurityUtils securityUtils;

    public LessonController(LessonService lessonService, SecurityUtils securityUtils) {
        this.lessonService = lessonService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/api/v1/classes/{classId}/lessons")
    public ResponseEntity<?> listLessons(@PathVariable UUID classId) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(lessonService.listByClass(classId, user)));
    }

    @PostMapping("/api/v1/classes/{classId}/lessons")
    public ResponseEntity<?> createLesson(@PathVariable UUID classId, @Valid @RequestBody LessonRequest request) {
        var user = securityUtils.getCurrentUser();
        var result = lessonService.create(classId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @GetMapping("/api/v1/lessons/{lessonId}")
    public ResponseEntity<?> getLesson(@PathVariable UUID lessonId) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getById(lessonId, user)));
    }

    @PatchMapping("/api/v1/lessons/{lessonId}")
    public ResponseEntity<?> updateLesson(@PathVariable UUID lessonId, @RequestBody LessonRequest request) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(lessonService.update(lessonId, request, user)));
    }

    @DeleteMapping("/api/v1/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable UUID lessonId) {
        var user = securityUtils.getCurrentUser();
        lessonService.delete(lessonId, user);
        return ResponseEntity.ok(ApiResponse.ok("Lesson deleted"));
    }
}
