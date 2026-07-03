package com.hoanobita.topikplatform.calendar;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.calendar.dto.CalendarEventResponse;
import com.hoanobita.topikplatform.calendar.dto.CalendarResponse;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.lesson.entity.Lesson;
import com.hoanobita.topikplatform.lesson.repository.LessonRepository;
import com.hoanobita.topikplatform.user.entity.User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CalendarService {
    private final LessonRepository lessonRepo;
    private final AssignmentRepository assignmentRepo;
    private final KlassRepository klassRepo;
    private final PermissionService permissions;
    private final SecurityUtils security;

    public CalendarService(LessonRepository lessonRepo, AssignmentRepository assignmentRepo, KlassRepository klassRepo,
                           PermissionService permissions, SecurityUtils security) {
        this.lessonRepo = lessonRepo;
        this.assignmentRepo = assignmentRepo;
        this.klassRepo = klassRepo;
        this.permissions = permissions;
        this.security = security;
    }

    public CalendarResponse calendar(LocalDate from, LocalDate to, UUID classId) {
        if (from == null || to == null) throw BusinessException.badRequest("from and to are required");
        if (from.isAfter(to)) throw BusinessException.badRequest("from must be before or equal to to");

        User user = security.currentUser();
        List<UUID> classIds = accessibleClassIds(user, classId);
        if (classIds.isEmpty()) return new CalendarResponse(List.of());

        List<Lesson> lessons = lessonRepo.findByClassIdIn(classIds);
        List<Assignment> assignments = user.isStudent()
                ? assignmentRepo.findByClassIdInAndStatusIn(classIds, List.of(com.hoanobita.topikplatform.common.Enums.AssignmentStatus.PUBLISHED, com.hoanobita.topikplatform.common.Enums.AssignmentStatus.CLOSED))
                : assignmentRepo.findByClassIdIn(classIds);

        List<CalendarEventResponse> events = new ArrayList<>();
        for (Lesson lesson : lessons) {
            if (lesson.getLessonDate() == null || lesson.getLessonDate().isBefore(from) || lesson.getLessonDate().isAfter(to)) continue;
            String className = klassRepo.findById(lesson.getClassId()).map(k -> k.getName()).orElse(null);
            events.add(new CalendarEventResponse("LESSON", lesson.getId(), lesson.getTitle(), lesson.getLessonDate(), null, lesson.getClassId(), className));
        }
        for (Assignment assignment : assignments) {
            if (assignment.getDueAt() == null) continue;
            LocalDate dueDate = assignment.getDueAt().atZone(ZoneId.systemDefault()).toLocalDate();
            if (dueDate.isBefore(from) || dueDate.isAfter(to)) continue;
            String className = klassRepo.findById(assignment.getClassId()).map(k -> k.getName()).orElse(null);
            events.add(new CalendarEventResponse("ASSIGNMENT_DEADLINE", assignment.getId(), assignment.getTitle(), null, assignment.getDueAt(), assignment.getClassId(), className));
        }

        events = events.stream().sorted(Comparator.comparing(this::eventInstant, Comparator.nullsLast(Comparator.naturalOrder()))).toList();
        return new CalendarResponse(events);
    }

    private List<UUID> accessibleClassIds(User user, UUID requestedClassId) {
        if (requestedClassId != null) {
            permissions.requireAccessClass(user, requestedClassId);
            return List.of(requestedClassId);
        }
        if (user.isTeacher()) return klassRepo.findAllActive().stream().map(k -> k.getId()).toList();
        List<UUID> ids = permissions.getAccessibleClassIds(user);
        return ids == null ? List.of() : ids;
    }

    private Instant eventInstant(CalendarEventResponse event) {
        if (event.dueAt() != null) return event.dueAt();
        if (event.date() != null) return event.date().atStartOfDay(ZoneId.systemDefault()).toInstant();
        return null;
    }
}
