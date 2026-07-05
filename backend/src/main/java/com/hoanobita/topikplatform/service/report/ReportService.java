package com.hoanobita.topikplatform.service.report;

import com.hoanobita.topikplatform.dto.report.*;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final KlassRepository classRepository;
    private final ClassMemberRepository classMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;
    private final PermissionService permissionService;
    private final SecurityUtils securityUtils;

    @Transactional(readOnly = true)
    public SystemReportResponse getSystemReport() {
        long totalUsers = userRepository.findAllActive().size();
        long totalClasses = classRepository.findAllActive().size();
        long totalAssignments = assignmentRepository.findAllActive().size();
        long totalSubmissions = submissionRepository.findAllActive().size();
        
        // Calculate global average score
        List<Double> allScores = gradeRepository.findAllActive().stream()
                .map(g -> g.getScore() != null ? g.getScore().doubleValue() : 0.0)
                .collect(Collectors.toList());
        double averageScore = allScores.isEmpty() ? 0.0 : allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        List<ClassPerformanceDto> classPerformances = classRepository.findAllActive().stream()
                .map(this::calculateClassPerformance)
                .collect(Collectors.toList());

        List<StudentPerformanceDto> topStudents = userRepository.findAllActive().stream()
                .filter(User::isStudent)
                .map(this::calculateStudentPerformance)
                .sorted((s1, s2) -> Double.compare(s2.getAverageScore(), s1.getAverageScore()))
                .limit(10)
                .collect(Collectors.toList());

        return SystemReportResponse.builder()
                .totalUsers(totalUsers)
                .totalClasses(totalClasses)
                .totalAssignments(totalAssignments)
                .totalSubmissions(totalSubmissions)
                .averageScore(averageScore)
                .classPerformances(classPerformances)
                .topStudents(topStudents)
                .build();
    }

    @Transactional(readOnly = true)
    public String exportSystemReportCsv() {
        SystemReportResponse report = getSystemReport();
        StringBuilder csv = new StringBuilder();
        csv.append("metric,value\n");
        csv.append("totalUsers,").append(report.getTotalUsers()).append('\n');
        csv.append("totalClasses,").append(report.getTotalClasses()).append('\n');
        csv.append("totalAssignments,").append(report.getTotalAssignments()).append('\n');
        csv.append("totalSubmissions,").append(report.getTotalSubmissions()).append('\n');
        csv.append("averageScore,").append(report.getAverageScore()).append('\n');
        csv.append('\n').append("classId,className,studentCount,assignmentCount,averageScore,submissionRate\n");
        for (ClassPerformanceDto item : report.getClassPerformances()) {
            csv.append(item.getClassId()).append(',')
                    .append(csv(item.getClassName())).append(',')
                    .append(item.getStudentCount()).append(',')
                    .append(item.getAssignmentCount()).append(',')
                    .append(item.getAverageScore()).append(',')
                    .append(item.getSubmissionRate()).append('\n');
        }
        csv.append('\n').append("userId,fullName,email,submissionCount,averageScore\n");
        for (StudentPerformanceDto item : report.getTopStudents()) {
            csv.append(item.getUserId()).append(',')
                    .append(csv(item.getFullName())).append(',')
                    .append(csv(item.getEmail())).append(',')
                    .append(item.getSubmissionCount()).append(',')
                    .append(item.getAverageScore()).append('\n');
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public ClassReportResponse getClassReport(UUID classId) {
        User currentUser = securityUtils.currentUser();
        permissionService.requireAccessClass(currentUser, classId);

        Klass klass = classRepository.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy lớp học"));

        List<ClassMember> members = classMemberRepository.findByClassIdAndStatus(classId, MemberStatus.ACTIVE);
        long totalStudents = members.size();
        List<Assignment> assignments = assignmentRepository.findByClassId(classId);
        long totalAssignments = assignments.size();
        
        List<UUID> assignmentIds = assignments.stream().map(Assignment::getId).collect(Collectors.toList());
        
        List<Double> classScores = assignmentIds.isEmpty() ? List.of() : gradeRepository.findByAssignmentIds(assignmentIds).stream().map(g -> g.getScore() != null ? g.getScore().doubleValue() : 0.0).collect(Collectors.toList());
        double averageScore = classScores.isEmpty() ? 0.0 : classScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        long expectedSubmissions = totalStudents * totalAssignments;
        long actualSubmissions = assignmentIds.isEmpty() ? 0 : submissionRepository.findByAssignmentIdIn(assignmentIds).size();
        double submissionRate = expectedSubmissions > 0 ? (double) actualSubmissions / expectedSubmissions * 100 : 0.0;

        // Batch-load students to avoid N+1
        Set<UUID> studentIds = members.stream().map(ClassMember::getStudentId).collect(Collectors.toSet());
        Map<UUID, User> studentsById = userRepository.findAllById(studentIds).stream()
                .filter(u -> u.getDeletedAt() == null)
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        List<StudentPerformanceDto> studentPerformances = members.stream()
                .map(member -> studentsById.get(member.getStudentId()))
                .filter(Objects::nonNull)
                .map(this::calculateStudentPerformance)
                .collect(Collectors.toList());

        // Pre-group submissions and grades by assignment to avoid N+1
        List<Submission> allSubmissions = submissionRepository.findByAssignmentIdIn(assignmentIds);
        Map<UUID, List<Submission>> subsByAssignment = allSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getAssignmentId));
        List<Grade> allGrades = gradeRepository.findByAssignmentIds(assignmentIds);
        Map<UUID, UUID> assignmentBySubId = allSubmissions.stream()
                .collect(Collectors.toMap(Submission::getId, Submission::getAssignmentId, (a, b) -> a));
        Map<UUID, List<Grade>> gradesByAssignment = allGrades.stream()
                .collect(Collectors.groupingBy(g -> assignmentBySubId.getOrDefault(g.getSubmissionId(), UUID.randomUUID())));

        List<AssignmentPerformanceDto> assignmentPerformances = assignments.stream()
                .map(assignment -> {
                    List<Submission> subs = subsByAssignment.getOrDefault(assignment.getId(), List.of());
                    long subCount = subs.size();
                    
                    List<Grade> aGrades = gradesByAssignment.getOrDefault(assignment.getId(), List.of());
                    List<Double> aScores = aGrades.stream()
                            .map(g -> g.getScore() != null ? g.getScore().doubleValue() : 0.0).collect(Collectors.toList());
                    double aScore = aScores.isEmpty() ? 0.0 : aScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    
                    long passCount = aGrades.stream()
                            .filter(g -> g.getScore() != null && g.getScore().doubleValue() >= 5.0).count();
                    double passRate = subCount > 0 ? (double) passCount / subCount * 100 : 0.0;

                    return AssignmentPerformanceDto.builder()
                            .assignmentId(assignment.getId())
                            .title(assignment.getTitle())
                            .submissionCount(subCount)
                            .averageScore(aScore)
                            .passRate(passRate)
                            .build();
                })
                .collect(Collectors.toList());

        return ClassReportResponse.builder()
                .classId(classId)
                .className(klass.getName())
                .totalStudents(totalStudents)
                .totalAssignments(totalAssignments)
                .averageScore(averageScore)
                .submissionRate(submissionRate)
                .studentPerformances(studentPerformances)
                .assignmentPerformances(assignmentPerformances)
                .build();
    }

    @Transactional(readOnly = true)
    public String exportClassReportCsv(UUID classId) {
        ClassReportResponse report = getClassReport(classId);
        StringBuilder csv = new StringBuilder();
        csv.append("metric,value\n");
        csv.append("classId,").append(report.getClassId()).append('\n');
        csv.append("className,").append(csv(report.getClassName())).append('\n');
        csv.append("totalStudents,").append(report.getTotalStudents()).append('\n');
        csv.append("totalAssignments,").append(report.getTotalAssignments()).append('\n');
        csv.append("averageScore,").append(report.getAverageScore()).append('\n');
        csv.append("submissionRate,").append(report.getSubmissionRate()).append('\n');
        csv.append('\n').append("userId,fullName,email,submissionCount,averageScore\n");
        for (StudentPerformanceDto item : report.getStudentPerformances()) {
            csv.append(item.getUserId()).append(',')
                    .append(csv(item.getFullName())).append(',')
                    .append(csv(item.getEmail())).append(',')
                    .append(item.getSubmissionCount()).append(',')
                    .append(item.getAverageScore()).append('\n');
        }
        csv.append('\n').append("assignmentId,title,submissionCount,averageScore,passRate\n");
        for (AssignmentPerformanceDto item : report.getAssignmentPerformances()) {
            csv.append(item.getAssignmentId()).append(',')
                    .append(csv(item.getTitle())).append(',')
                    .append(item.getSubmissionCount()).append(',')
                    .append(item.getAverageScore()).append(',')
                    .append(item.getPassRate()).append('\n');
        }
        return csv.toString();
    }

    private ClassPerformanceDto calculateClassPerformance(Klass klass) {
        long studentCount = classMemberRepository.countByClassId(klass.getId());
        long assignmentCount = assignmentRepository.findByClassId(klass.getId()).size();
        
        List<UUID> assignmentIds = assignmentRepository.findByClassId(klass.getId()).stream().map(a -> a.getId()).collect(Collectors.toList());
        
        List<Double> classScores = assignmentIds.isEmpty() ? List.of() : gradeRepository.findByAssignmentIds(assignmentIds).stream().map(g -> g.getScore() != null ? g.getScore().doubleValue() : 0.0).collect(Collectors.toList());
        double averageScore = classScores.isEmpty() ? 0.0 : classScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        long expectedSubmissions = studentCount * assignmentCount;
        long actualSubmissions = assignmentIds.isEmpty() ? 0 : submissionRepository.findByAssignmentIdIn(assignmentIds).size();
        double submissionRate = expectedSubmissions > 0 ? (double) actualSubmissions / expectedSubmissions * 100 : 0.0;

        return ClassPerformanceDto.builder()
                .classId(klass.getId())
                .className(klass.getName())
                .studentCount(studentCount)
                .assignmentCount(assignmentCount)
                .averageScore(averageScore)
                .submissionRate(submissionRate)
                .build();
    }

    private String csv(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private StudentPerformanceDto calculateStudentPerformance(User student) {
        long submissionCount = submissionRepository.findByStudentId(student.getId()).size();
        
        List<Double> studentScores = gradeRepository.findByStudentId(student.getId()).stream()
                .map(g -> g.getScore() != null ? g.getScore().doubleValue() : 0.0).collect(Collectors.toList());
        double averageScore = studentScores.isEmpty() ? 0.0 : studentScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        return StudentPerformanceDto.builder()
                .userId(student.getId())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .submissionCount(submissionCount)
                .averageScore(averageScore)
                .build();
    }
}
