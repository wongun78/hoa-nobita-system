package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.risk.RiskDetectionService;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RiskDetectionServiceTest {

    @Test
    void returnsHighRiskWhenMultipleRulesTriggered() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        Assignment a1 = assignment(classId, BigDecimal.TEN);
        Assignment a2 = assignment(classId, BigDecimal.TEN);
        Assignment a3 = assignment(classId, BigDecimal.TEN);

        Submission s1 = submission(a1.getId(), studentId, SubmissionStatus.LATE, Instant.now().minusSeconds(20L * 24 * 3600));

        Grade g1 = grade(s1.getId(), new BigDecimal("4"));

        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        GradeRepository gradeRepository = mock(GradeRepository.class);

        when(assignmentRepository.findByClassId(classId)).thenReturn(List.of(a1, a2, a3));
        when(submissionRepository.findByStudentId(studentId)).thenReturn(List.of(s1));
        when(gradeRepository.findBySubmissionIdList(s1.getId())).thenReturn(List.of(g1));

        var service = new RiskDetectionService(assignmentRepository, submissionRepository, gradeRepository);
        var result = service.evaluateStudentForClass(studentId, classId);

        assertEquals("HIGH", result.riskLevel());
        assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Chưa nộp")));
        assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Điểm TB")));
        assertTrue(result.reasons().stream().anyMatch(r -> r.contains("14 ngày")));
    }

    @Test
    void returnsLowRiskWhenNoRulesTriggered() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        Assignment a1 = assignment(classId, BigDecimal.TEN);
        Assignment a2 = assignment(classId, BigDecimal.TEN);

        Submission s1 = submission(a1.getId(), studentId, SubmissionStatus.SUBMITTED, Instant.now().minusSeconds(2L * 24 * 3600));
        Submission s2 = submission(a2.getId(), studentId, SubmissionStatus.GRADED, Instant.now().minusSeconds(3L * 24 * 3600));

        Grade g2 = grade(s2.getId(), new BigDecimal("9"));

        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        GradeRepository gradeRepository = mock(GradeRepository.class);

        when(assignmentRepository.findByClassId(classId)).thenReturn(List.of(a1, a2));
        when(submissionRepository.findByStudentId(studentId)).thenReturn(List.of(s1, s2));
        when(gradeRepository.findBySubmissionIdList(s1.getId())).thenReturn(List.of());
        when(gradeRepository.findBySubmissionIdList(s2.getId())).thenReturn(List.of(g2));

        var service = new RiskDetectionService(assignmentRepository, submissionRepository, gradeRepository);
        var result = service.evaluateStudentForClass(studentId, classId);

        assertEquals("LOW", result.riskLevel());
        assertEquals(0, result.reasons().size());
    }

    private Assignment assignment(UUID classId, BigDecimal maxScore) {
        Assignment assignment = new Assignment();
        assignment.setId(UUID.randomUUID());
        assignment.setClassId(classId);
        assignment.setMaxScore(maxScore);
        assignment.setTitle("A");
        return assignment;
    }

    private Submission submission(UUID assignmentId, UUID studentId, SubmissionStatus status, Instant submittedAt) {
        Submission submission = new Submission();
        submission.setId(UUID.randomUUID());
        submission.setAssignmentId(assignmentId);
        submission.setStudentId(studentId);
        submission.setStatus(status);
        submission.setSubmittedAt(submittedAt);
        return submission;
    }

    private Grade grade(UUID submissionId, BigDecimal score) {
        Grade grade = new Grade();
        grade.setSubmissionId(submissionId);
        grade.setScore(score);
        grade.setGradedBy(UUID.randomUUID());
        return grade;
    }
}