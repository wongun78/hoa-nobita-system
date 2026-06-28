package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
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
import java.util.List;
import java.util.UUID;

@Service
public class GradingService {
    private final GradeRepository grades;
    private final SubmissionRepository submissions;
    private final AssignmentRepository assignments;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final SubmissionService submissionService;

    public GradingService(GradeRepository grades, SubmissionRepository submissions, AssignmentRepository assignments, PermissionService permissions, SecurityUtils security, SubmissionService submissionService) {
        this.grades = grades;
        this.submissions = submissions;
        this.assignments = assignments;
        this.permissions = permissions;
        this.security = security;
        this.submissionService = submissionService;
    }

    public List<SubmissionResponse> classSubmissions(UUID classId) {
        permissions.requireManageClass(security.currentUser(), classId);
        List<UUID> assignmentIds = assignments.findByClassId(classId).stream().map(Assignment::getId).toList();
        if (assignmentIds.isEmpty()) return List.of();
        return submissions.findByAssignmentIdIn(assignmentIds).stream().map(submissionService::toResponse).toList();
    }

    @Transactional
    public GradeResponse grade(UUID submissionId, GradeRequest req) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Score cannot exceed assignment max score");
        Grade g = grades.findBySubmissionId(submissionId).orElseGet(Grade::new);
        g.setSubmissionId(submissionId);
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        g.setGradedBy(security.currentUser().getId());
        g.setGradedAt(Instant.now());
        s.setStatus(SubmissionStatus.GRADED);
        submissions.save(s);
        return toResponse(grades.save(g));
    }

    @Transactional
    public GradeResponse update(UUID gradeId, GradeRequest req) {
        Grade g = grades.findById(gradeId).orElseThrow(() -> BusinessException.notFound("Grade not found"));
        Submission s = submissions.findActiveById(g.getSubmissionId()).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Score cannot exceed assignment max score");
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        return toResponse(grades.save(g));
    }

    @Transactional
    public void requestResubmit(UUID submissionId) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Submission not found"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Assignment not found"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        s.setStatus(SubmissionStatus.RESUBMIT_REQUESTED);
        submissions.save(s);
    }

    private GradeResponse toResponse(Grade g) {
        return new GradeResponse(g.getId(), g.getSubmissionId(), g.getScore(), g.getFeedback(), g.getGradedBy(), g.getGradedAt());
    }
}
