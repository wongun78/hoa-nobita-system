package com.hoanobita.topikplatform.risk;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RiskDetectionService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;

    public RiskDetectionService(
            AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository,
            GradeRepository gradeRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.gradeRepository = gradeRepository;
    }

    public RiskEvaluation evaluateStudentForClass(UUID studentId, UUID classId) {
        var assignments = assignmentRepository.findByClassId(classId);
        if (assignments.isEmpty()) {
            return new RiskEvaluation("LOW", List.of(), BigDecimal.ZERO, BigDecimal.ZERO, 0);
        }

        var assignmentIds = assignments.stream().map(Assignment::getId).collect(Collectors.toSet());
        var allStudentSubmissions = submissionRepository.findByStudentId(studentId);

        var classSubmissions = allStudentSubmissions.stream()
                .filter(sub -> assignmentIds.contains(sub.getAssignmentId()))
                .toList();

        return evaluateInternal(assignments, classSubmissions);
    }

    public RiskEvaluation evaluateStudentAcrossClasses(UUID studentId, List<UUID> classIds) {
        if (classIds == null || classIds.isEmpty()) {
            return new RiskEvaluation("LOW", List.of(), BigDecimal.ZERO, BigDecimal.ZERO, 0);
        }

        var allAssignments = assignmentRepository.findByClassIdIn(classIds);
        if (allAssignments.isEmpty()) {
            return new RiskEvaluation("LOW", List.of(), BigDecimal.ZERO, BigDecimal.ZERO, 0);
        }

        Map<UUID, List<Assignment>> assignmentsByClass = allAssignments.stream()
                .collect(Collectors.groupingBy(Assignment::getClassId));

        var allStudentSubmissions = submissionRepository.findByStudentId(studentId);
        Map<UUID, Submission> submissionByAssignmentId = new HashMap<>();
        for (Submission submission : allStudentSubmissions) {
            submissionByAssignmentId.put(submission.getAssignmentId(), submission);
        }

        RiskEvaluation highest = new RiskEvaluation("LOW", List.of(), BigDecimal.ZERO, BigDecimal.ZERO, 0);
        for (UUID classId : classIds) {
            var classAssignments = assignmentsByClass.getOrDefault(classId, Collections.emptyList());
            if (classAssignments.isEmpty()) {
                continue;
            }

            List<Submission> classSubmissions = classAssignments.stream()
                    .map(assignment -> submissionByAssignmentId.get(assignment.getId()))
                    .filter(Objects::nonNull)
                    .toList();

            var evaluation = evaluateInternal(classAssignments, classSubmissions);
            if (evaluation.triggeredRuleCount() > highest.triggeredRuleCount()) {
                highest = evaluation;
            }
        }

        return highest;
    }

    @SuppressWarnings({"java:S3776", "java:S6541", "java:S135"})
    private RiskEvaluation evaluateInternal(List<Assignment> assignments, List<Submission> submissions) {
        int totalAssignments = assignments.size();
        int submittedAssignments = submissions.size();
        int missingAssignments = Math.max(totalAssignments - submittedAssignments, 0);

        long lateCount = submissions.stream()
                .filter(sub -> sub.getStatus() == SubmissionStatus.LATE)
                .count();

        long resubmitRequestedCount = submissions.stream()
                .filter(sub -> sub.getStatus() == SubmissionStatus.RESUBMIT_REQUESTED)
                .count();

        Instant latestSubmissionAt = submissions.stream()
                .map(Submission::getSubmittedAt)
            .filter(Objects::nonNull)
                .max(Instant::compareTo)
                .orElse(null);

        var assignmentById = assignments.stream()
                .collect(Collectors.toMap(Assignment::getId, assignment -> assignment));

        var grades = submissions.stream()
                .flatMap(sub -> gradeRepository.findBySubmissionIdList(sub.getId()).stream())
                .toList();

        BigDecimal averageScorePercent = BigDecimal.ZERO;
        if (!grades.isEmpty()) {
            BigDecimal totalPercent = BigDecimal.ZERO;
            int counted = 0;
            for (Grade grade : grades) {
                Submission submission = submissions.stream()
                        .filter(sub -> sub.getId().equals(grade.getSubmissionId()))
                        .findFirst()
                        .orElse(null);
                if (submission == null) {
                    continue;
                }

                Assignment assignment = assignmentById.get(submission.getAssignmentId());
                if (assignment == null || assignment.getMaxScore() == null || assignment.getMaxScore().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                BigDecimal normalized = grade.getScore()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(assignment.getMaxScore(), 2, RoundingMode.HALF_UP);
                totalPercent = totalPercent.add(normalized);
                counted++;
            }

            if (counted > 0) {
                averageScorePercent = totalPercent.divide(BigDecimal.valueOf(counted), 2, RoundingMode.HALF_UP);
            }
        }

        BigDecimal submissionRatePercent = BigDecimal.ZERO;
        if (totalAssignments > 0) {
            submissionRatePercent = BigDecimal.valueOf(submittedAssignments)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalAssignments), 2, RoundingMode.HALF_UP);
        }

        List<String> reasons = new ArrayList<>();

        if (missingAssignments >= 2) {
            reasons.add("Chưa nộp " + missingAssignments + " bài");
        }

        if (averageScorePercent.compareTo(BigDecimal.ZERO) > 0 && averageScorePercent.compareTo(BigDecimal.valueOf(60)) < 0) {
            reasons.add("Điểm TB " + averageScorePercent.stripTrailingZeros().toPlainString() + "%");
        }

        if (lateCount >= 2) {
            reasons.add("Nộp trễ " + lateCount + " lần");
        }

        Instant threshold = Instant.now().minus(14, ChronoUnit.DAYS);
        if (latestSubmissionAt == null || latestSubmissionAt.isBefore(threshold)) {
            reasons.add("Không có bài nộp trong 14 ngày");
        }

        if (resubmitRequestedCount >= 2) {
            reasons.add("Bị yêu cầu nộp lại " + resubmitRequestedCount + " lần");
        }

        String riskLevel;
        if (reasons.isEmpty()) {
            riskLevel = "LOW";
        } else if (reasons.size() == 1) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "HIGH";
        }

        return new RiskEvaluation(riskLevel, reasons, submissionRatePercent, averageScorePercent, reasons.size());
    }

    public record RiskEvaluation(
            String riskLevel,
            List<String> reasons,
            BigDecimal submissionRatePercent,
            BigDecimal averageScorePercent,
            int triggeredRuleCount
    ) {
    }
}