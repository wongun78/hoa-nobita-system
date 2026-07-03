package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PaginationUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.grading.dto.BulkGradeRequest;
import com.hoanobita.topikplatform.grading.dto.BulkGradeResponse;
import com.hoanobita.topikplatform.grading.dto.GradeRequest;
import com.hoanobita.topikplatform.grading.dto.GradeResponse;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.submission.SubmissionService;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GradingService {
    private final GradeRepository grades;
    private final SubmissionRepository submissions;
    private final AssignmentRepository assignments;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final SubmissionService submissionService;
    private final ActivityService activityService;

    public GradingService(GradeRepository grades, SubmissionRepository submissions, AssignmentRepository assignments, PermissionService permissions, SecurityUtils security, SubmissionService submissionService, ActivityService activityService) {
        this.grades = grades;
        this.submissions = submissions;
        this.assignments = assignments;
        this.permissions = permissions;
        this.security = security;
        this.submissionService = submissionService;
        this.activityService = activityService;
    }

    public PageResponse<SubmissionResponse> classSubmissions(UUID classId, Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PaginationUtil.normalizePage(page);
        int normalizedSize = PaginationUtil.normalizeSize(size);

        permissions.requireManageClass(security.currentUser(), classId);
        List<UUID> assignmentIds = assignments.findByClassId(classId).stream().map(Assignment::getId).toList();
        if (assignmentIds.isEmpty()) return PaginationUtil.paginate(List.of(), normalizedPage, normalizedSize);

        List<SubmissionResponse> filtered = submissions.findByAssignmentIdIn(assignmentIds).stream()
                .map(submissionService::toResponse)
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(status))
                .filter(item -> {
                    if (search == null || search.isBlank()) return true;
                    String keyword = search.toLowerCase();
                    return containsIgnoreCase(item.studentName(), keyword)
                            || containsIgnoreCase(item.assignmentTitle(), keyword)
                            || containsIgnoreCase(item.className(), keyword);
                })
                .toList();

        Comparator<SubmissionResponse> defaultSort = Comparator.comparing(SubmissionResponse::submittedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        Comparator<SubmissionResponse> comparator = PaginationUtil.resolveSort(sort, Map.of(
                "submittedAt", Comparator.comparing(SubmissionResponse::submittedAt, Comparator.nullsLast(Comparator.naturalOrder())),
                "studentName", Comparator.comparing(SubmissionResponse::studentName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "assignmentTitle", Comparator.comparing(SubmissionResponse::assignmentTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)),
                "status", Comparator.comparing(SubmissionResponse::status, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        ), defaultSort);

        List<SubmissionResponse> sorted = filtered.stream().sorted(comparator).toList();
        return PaginationUtil.paginate(sorted, normalizedPage, normalizedSize);
    }

    @Transactional
    public BulkGradeResponse bulkGrade(UUID assignmentId, BulkGradeRequest request) {
        Assignment assignment = assignments.findActiveById(assignmentId)
                .orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), assignment.getClassId());
        if (request == null || request.grades() == null || request.grades().isEmpty()) {
            throw BusinessException.badRequest("grades must not be empty");
        }

        int gradedCount = 0;
        List<BulkGradeResponse.BulkGradeError> errors = new java.util.ArrayList<>();
        for (var item : request.grades()) {
            UUID submissionId = item == null ? null : item.submissionId();
            try {
                if (submissionId == null) throw BusinessException.badRequest("submissionId is required");
                if (item.score() == null) throw BusinessException.badRequest("score is required");
                Submission submission = submissions.findActiveById(submissionId)
                        .orElseThrow(() -> BusinessException.notFound("Submission not found"));
                if (!submission.getAssignmentId().equals(assignmentId)) {
                    throw BusinessException.badRequest("Submission does not belong to this assignment");
                }
                if (item.score().signum() < 0) throw BusinessException.badRequest("Score cannot be negative");
                if (item.score().compareTo(assignment.getMaxScore()) > 0) throw BusinessException.badRequest("Score cannot exceed assignment max score");

                Grade grade = grades.findBySubmissionId(submissionId).orElseGet(Grade::new);
                grade.setSubmissionId(submissionId);
                grade.setScore(item.score());
                grade.setFeedback(item.feedback());
                grade.setGradedBy(security.currentUser().getId());
                grade.setGradedAt(Instant.now());
                submission.setStatus(SubmissionStatus.GRADED);
                submissions.save(submission);
                grades.save(grade);
                gradedCount++;
            } catch (RuntimeException ex) {
                errors.add(new BulkGradeResponse.BulkGradeError(submissionId, ex.getMessage()));
            }
        }
        if (gradedCount > 0) {
            activityService.log("SUBMISSIONS_BULK_GRADED", "ASSIGNMENT", assignment.getId(), assignment.getTitle(), assignment.getClassId(), "Đã chấm hàng loạt " + gradedCount + " bài nộp cho bài tập: " + assignment.getTitle());
        }
        return new BulkGradeResponse(gradedCount, errors.size(), errors);
    }

    @Transactional
    public GradeResponse grade(UUID submissionId, GradeRequest req) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().signum() < 0) throw BusinessException.badRequest("Score cannot be negative");
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Score cannot exceed assignment max score");
        Grade g = grades.findBySubmissionId(submissionId).orElseGet(Grade::new);
        g.setSubmissionId(submissionId);
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        g.setGradedBy(security.currentUser().getId());
        g.setGradedAt(Instant.now());
        s.setStatus(SubmissionStatus.GRADED);
        submissions.save(s);
        activityService.log("SUBMISSION_GRADED", "SUBMISSION", s.getId(), "Bài nộp của học viên", a.getClassId(), "Đã chấm điểm bài nộp cho bài tập: " + a.getTitle());
        return toResponse(grades.save(g));
    }

    @Transactional
    public GradeResponse update(UUID gradeId, GradeRequest req) {
        Grade g = grades.findById(gradeId).orElseThrow(() -> BusinessException.notFound("Grade not found"));
        Submission s = submissions.findActiveById(g.getSubmissionId()).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().signum() < 0) throw BusinessException.badRequest("Score cannot be negative");
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Score cannot exceed assignment max score");
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        activityService.log("GRADE_UPDATED", "SUBMISSION", s.getId(), "Bài nộp của học viên", a.getClassId(), "Đã cập nhật điểm bài nộp cho bài tập: " + a.getTitle());
        return toResponse(grades.save(g));
    }

    @Transactional
    public void requestResubmit(UUID submissionId) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        s.setStatus(SubmissionStatus.RESUBMIT_REQUESTED);
        submissions.save(s);
        activityService.log("RESUBMIT_REQUESTED", "SUBMISSION", s.getId(), "Bài nộp của học viên", a.getClassId(), "Đã yêu cầu nộp lại bài tập: " + a.getTitle());
    }

    private GradeResponse toResponse(Grade g) {
        return new GradeResponse(g.getId(), g.getSubmissionId(), g.getScore(), g.getFeedback(), g.getGradedBy(), g.getGradedAt());
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
