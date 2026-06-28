package com.hoanobita.topikplatform.submission;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.submission.dto.SubmissionRequest;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SubmissionService {
    private final SubmissionRepository repo;
    private final AssignmentRepository assignments;
    private final GradeRepository grades;
    private final KlassRepository klasses;
    private final UserRepository users;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final ActivityService activityService;

    public SubmissionService(SubmissionRepository repo, AssignmentRepository assignments, GradeRepository grades, KlassRepository klasses, UserRepository users, PermissionService permissions, SecurityUtils security, ActivityService activityService) {
        this.repo = repo;
        this.assignments = assignments;
        this.grades = grades;
        this.klasses = klasses;
        this.users = users;
        this.permissions = permissions;
        this.security = security;
        this.activityService = activityService;
    }

    public List<SubmissionResponse> byAssignment(UUID assignmentId) {
        Assignment a = assignment(assignmentId);
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        return repo.findByAssignmentId(assignmentId).stream().map(this::toResponse).toList();
    }

    public List<SubmissionResponse> mySubmissions() {
        User user = security.currentUser();
        if (!user.isStudent()) throw BusinessException.forbidden("Only students can use this endpoint");
        return repo.findByStudentId(user.getId()).stream().map(this::toResponse).toList();
    }

    public SubmissionResponse get(UUID id) {
        Submission s = find(id);
        User user = security.currentUser();
        Assignment a = assignment(s.getAssignmentId());
        if (user.isStudent()) {
            if (!s.getStudentId().equals(user.getId())) throw BusinessException.forbidden("Cannot access another student's submission");
        } else {
            permissions.requireManageClass(user, a.getClassId());
        }
        return toResponse(s);
    }

    @Transactional
    public SubmissionResponse submit(UUID assignmentId, SubmissionRequest req) {
        User user = security.currentUser();
        if (!user.isStudent()) throw BusinessException.forbidden("Only students can submit assignments");
        Assignment a = assignment(assignmentId);
        permissions.requireAccessClass(user, a.getClassId());
        if (a.getStatus() != AssignmentStatus.PUBLISHED) throw BusinessException.badRequest("Assignment is not open for submission");
        if (blank(req.contentText()) && blank(req.contentUrl()) && req.fileId() == null) throw BusinessException.badRequest("Submission must include text, URL, or file");
        repo.findByAssignmentIdAndStudentId(assignmentId, user.getId()).ifPresent(existing -> {
            if (existing.getStatus() == SubmissionStatus.GRADED || existing.getStatus() == SubmissionStatus.SUBMITTED || existing.getStatus() == SubmissionStatus.LATE) {
                throw BusinessException.conflict("Submission already exists");
            }
        });
        Submission s = new Submission();
        s.setAssignmentId(assignmentId);
        s.setStudentId(user.getId());
        s.setContentText(req.contentText());
        s.setContentUrl(req.contentUrl());
        s.setFileId(req.fileId());
        s.setSubmittedAt(Instant.now());
        s.setStatus(a.getDueAt() != null && Instant.now().isAfter(a.getDueAt()) ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED);
        repo.save(s);
        activityService.log("SUBMISSION_CREATED", "SUBMISSION", s.getId(), "Bài nộp của " + user.getFullName(), a.getClassId(), "Học viên " + user.getFullName() + " đã nộp bài tập: " + a.getTitle());
        return toResponse(s);
    }

    @Transactional
    public SubmissionResponse update(UUID id, SubmissionRequest req) {
        Submission s = find(id);
        User user = security.currentUser();
        if (!s.getStudentId().equals(user.getId())) throw BusinessException.forbidden("Cannot edit this submission");
        if (s.getStatus() == SubmissionStatus.GRADED) throw BusinessException.badRequest("Graded submission cannot be edited");
        if (blank(req.contentText()) && blank(req.contentUrl()) && req.fileId() == null) throw BusinessException.badRequest("Submission must include text, URL, or file");
        s.setContentText(req.contentText());
        s.setContentUrl(req.contentUrl());
        s.setFileId(req.fileId());
        repo.save(s);
        Assignment a = assignment(s.getAssignmentId());
        activityService.log("SUBMISSION_UPDATED", "SUBMISSION", s.getId(), "Bài nộp của " + user.getFullName(), a.getClassId(), "Học viên " + user.getFullName() + " đã cập nhật bài nộp cho bài tập: " + a.getTitle());
        return toResponse(s);
    }

    @Transactional
    public void delete(UUID id) {
        Submission s = find(id);
        User user = security.currentUser();
        if (!s.getStudentId().equals(user.getId())) throw BusinessException.forbidden("Cannot delete this submission");
        s.setDeletedAt(Instant.now());
        repo.save(s);
        Assignment a = assignment(s.getAssignmentId());
        activityService.log("SUBMISSION_DELETED", "SUBMISSION", s.getId(), "Bài nộp của " + user.getFullName(), a.getClassId(), "Học viên " + user.getFullName() + " đã xóa bài nộp cho bài tập: " + a.getTitle());
    }

    public Submission find(UUID id) {
        return repo.findActiveById(id).orElseThrow(() -> BusinessException.notFound("Submission not found"));
    }

    private Assignment assignment(UUID id) {
        return assignments.findActiveById(id).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
    }

    private boolean blank(String v) { return v == null || v.isBlank(); }

    public SubmissionResponse toResponse(Submission s) {
        var grade = grades.findBySubmissionId(s.getId()).orElse(null);
        var assignment = assignments.findById(s.getAssignmentId()).orElse(null);
        var klass = assignment != null ? klasses.findById(assignment.getClassId()).orElse(null) : null;
        var student = users.findById(s.getStudentId()).orElse(null);
        
        return new SubmissionResponse(
                s.getId(), 
                s.getAssignmentId(), 
                assignment != null ? assignment.getTitle() : "Unknown Assignment",
                klass != null ? klass.getName() : "Unknown Class",
                s.getStudentId(), 
                student != null ? student.getFullName() : "Unknown Student",
                s.getContentText(), 
                s.getContentUrl(), 
                s.getFileId(), 
                s.getStatus().name(), 
                s.getSubmittedAt(), 
                grade == null ? null : grade.getScore(), 
                assignment != null ? assignment.getMaxScore() : null,
                grade == null ? null : grade.getFeedback()
        );
    }
}
