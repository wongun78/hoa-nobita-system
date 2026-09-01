package com.hoanobita.topikplatform.grading;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.common.PageResponse;
import com.hoanobita.topikplatform.common.PageableUtil;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.grading.dto.GradeRequest;
import com.hoanobita.topikplatform.grading.dto.GradeResponse;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.Enums.MemberStatus;
import com.hoanobita.topikplatform.file.FileService;
import com.hoanobita.topikplatform.submission.SubmissionService;
import com.hoanobita.topikplatform.submission.dto.SubmissionResponse;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class GradingService {
    private final GradeRepository grades;
    private final SubmissionRepository submissions;
    private final AssignmentRepository assignments;
    private final PermissionService permissions;
    private final SecurityUtils security;
    private final SubmissionService submissionService;
    private final ActivityService activityService;
    private final ClassMemberRepository classMembers;
    private final KlassRepository klasses;
    private final UserRepository users;
    private final FileService fileService;

    public GradingService(GradeRepository grades, SubmissionRepository submissions, AssignmentRepository assignments, PermissionService permissions, SecurityUtils security, SubmissionService submissionService, ActivityService activityService, ClassMemberRepository classMembers, KlassRepository klasses, UserRepository users, FileService fileService) {
        this.grades = grades;
        this.submissions = submissions;
        this.assignments = assignments;
        this.permissions = permissions;
        this.security = security;
        this.submissionService = submissionService;
        this.activityService = activityService;
        this.classMembers = classMembers;
        this.klasses = klasses;
        this.users = users;
        this.fileService = fileService;
    }

    public PageResponse<SubmissionResponse> classSubmissions(UUID classId, Integer page, Integer size, String sort, String search, String status) {
        return submissions(classId, page, size, sort, search, status);
    }

    public PageResponse<SubmissionResponse> submissions(UUID classId, Integer page, Integer size, String sort, String search, String status) {
        int normalizedPage = PageableUtil.normalizePage(page);
        int normalizedSize = PageableUtil.normalizeSize(size);

        var currentUser = security.currentUser();
        List<com.hoanobita.topikplatform.submission.entity.Submission> source;
        if (classId != null) {
            permissions.requireManageClass(currentUser, classId);
            List<UUID> assignmentIds = assignments.findByClassId(classId).stream().map(Assignment::getId).toList();
            source = assignmentIds.isEmpty() ? List.of() : submissions.findByAssignmentIdIn(assignmentIds);
        } else if (currentUser.isTeacher()) {
            source = submissions.findAllActive();
        } else {
            List<UUID> accessibleClassIds = permissions.getAccessibleClassIds(currentUser);
            if (accessibleClassIds == null || accessibleClassIds.isEmpty()) return PageableUtil.paginateInMemory(List.of(), normalizedPage, normalizedSize);
            List<UUID> assignmentIds = accessibleClassIds.stream()
                    .flatMap(id -> assignments.findByClassId(id).stream())
                    .map(Assignment::getId)
                    .toList();
            source = assignmentIds.isEmpty() ? List.of() : submissions.findByAssignmentIdIn(assignmentIds);
        }

        List<SubmissionResponse> filtered = source.stream()
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

        Comparator<SubmissionResponse> comparator = resolveSubmissionSort(sort);
        List<SubmissionResponse> sorted = filtered.stream().sorted(comparator).toList();
        return PageableUtil.paginateInMemory(sorted, normalizedPage, normalizedSize);
    }

    private Comparator<SubmissionResponse> resolveSubmissionSort(String sort) {
        Comparator<SubmissionResponse> defaultSort = Comparator.comparing(SubmissionResponse::submittedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        if (sort == null || sort.isBlank()) return defaultSort;
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        boolean desc = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim());
        Comparator<SubmissionResponse> cmp = switch (field) {
            case "submittedAt" -> Comparator.comparing(SubmissionResponse::submittedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "studentName" -> Comparator.comparing(SubmissionResponse::studentName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "assignmentTitle" -> Comparator.comparing(SubmissionResponse::assignmentTitle, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "status" -> Comparator.comparing(SubmissionResponse::status, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> null;
        };
        if (cmp == null) return defaultSort;
        return desc ? cmp.reversed() : cmp;
    }

    @Transactional
    public GradeResponse grade(UUID submissionId, GradeRequest req) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài nộp"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài tập"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().signum() < 0) throw BusinessException.badRequest("Điểm không được âm");
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Điểm không được vượt quá điểm tối đa");
        Grade g = grades.findBySubmissionId(submissionId).orElseGet(Grade::new);
        g.setSubmissionId(submissionId);
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        g.setGradedBy(security.currentUser().getId());
        g.setGradedAt(Instant.now());
        s.setStatus(SubmissionStatus.GRADED);
        if (req.feedbackFileId() != null) s.setFeedbackFileId(req.feedbackFileId());
        if (req.feedbackLink() != null) s.setFeedbackLink(req.feedbackLink());
        submissions.save(s);
        activityService.log("SUBMISSION_GRADED", "SUBMISSION", s.getId(), "Bài nộp của học viên", a.getClassId(), "Đã chấm điểm bài nộp cho bài tập: " + a.getTitle());
        return toResponse(grades.save(g));
    }

    @Transactional
    public GradeResponse update(UUID gradeId, GradeRequest req) {
        Grade g = grades.findById(gradeId).orElseThrow(() -> BusinessException.notFound("Không tìm thấy điểm"));
        Submission s = submissions.findActiveById(g.getSubmissionId()).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài nộp"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài tập"));
        permissions.requireManageClass(security.currentUser(), a.getClassId());
        if (req.score().signum() < 0) throw BusinessException.badRequest("Điểm không được âm");
        if (req.score().compareTo(a.getMaxScore()) > 0) throw BusinessException.badRequest("Điểm không được vượt quá điểm tối đa");
        g.setScore(req.score());
        g.setFeedback(req.feedback());
        if (req.feedbackFileId() != null) s.setFeedbackFileId(req.feedbackFileId());
        if (req.feedbackLink() != null) s.setFeedbackLink(req.feedbackLink());
        submissions.save(s);
        activityService.log("GRADE_UPDATED", "SUBMISSION", s.getId(), "Bài nộp của học viên", a.getClassId(), "Đã cập nhật điểm bài nộp cho bài tập: " + a.getTitle());
        return toResponse(grades.save(g));
    }

    @Transactional
    public void requestResubmit(UUID submissionId) {
        Submission s = submissions.findActiveById(submissionId).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài nộp"));
        Assignment a = assignments.findActiveById(s.getAssignmentId()).orElseThrow(() -> BusinessException.notFound("Không tìm thấy bài tập"));
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

    // ── ZIP export ──────────────────────────────────────────────────────

    public byte[] exportSubmissionsZip(UUID assignmentId, UUID classId) {
        var currentUser = security.currentUser();
        permissions.requireTeacherOrAdmin(currentUser);

        Assignment assignment = assignments.findActiveById(assignmentId)
                .orElseThrow(() -> BusinessException.notFound("Bài tập không tồn tại"));

        // Derive classId from assignment if not provided
        if (classId == null) {
            classId = assignment.getClassId();
        }
        permissions.requireManageClass(currentUser, classId);

        if (!assignment.getClassId().equals(classId)) {
            throw BusinessException.badRequest("Bài tập không thuộc lớp này");
        }

        Klass klass = klasses.findById(classId)
                .orElseThrow(() -> BusinessException.notFound("Lớp không tồn tại"));

        List<ClassMember> members = classMembers.findByClassIdAndStatus(classId, MemberStatus.ACTIVE);

        // Pre-fetch users
        Map<UUID, User> userMap = new HashMap<>();
        for (ClassMember m : members) {
            users.findById(m.getStudentId()).ifPresent(u -> userMap.put(m.getStudentId(), u));
        }

        // Sort by studentCode (null last), then studentName
        List<ClassMember> sorted = new ArrayList<>(members);
        sorted.sort(Comparator
                .comparing((ClassMember m) -> m.getStudentCode() == null ? "\uFFFF" : m.getStudentCode())
                .thenComparing(m -> {
                    User u = userMap.get(m.getStudentId());
                    return u != null ? u.getFullName() : "";
                }));

        // Map studentId → submission
        List<Submission> subs = submissions.findByAssignmentId(assignmentId);
        Map<UUID, Submission> subMap = new HashMap<>();
        for (Submission s : subs) {
            subMap.putIfAbsent(s.getStudentId(), s);
        }

        // Build CSV rows + ZIP
        List<String[]> csvRows = new ArrayList<>();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            int fileSeq = 0;
            int stt = 0;

            for (ClassMember member : sorted) {
                stt++;
                User student = userMap.get(member.getStudentId());
                String studentName = student != null ? student.getFullName() : "Unknown";
                String studentCode = member.getStudentCode() != null ? member.getStudentCode() : "";

                Submission sub = subMap.get(member.getStudentId());

                String status = "Chưa nộp";
                String submittedAt = "";
                String fileName = "";
                String externalLink = "";
                String score = "";
                UUID fileId = null;

                if (sub != null) {
                    status = switch (sub.getStatus()) {
                        case SUBMITTED -> "Đã nộp";
                        case GRADED -> "Đã chấm";
                        case LATE -> "Nộp muộn";
                        case RESUBMIT_REQUESTED -> "Yêu cầu nộp lại";
                        default -> sub.getStatus().name();
                    };
                    submittedAt = sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : "";
                    externalLink = sub.getContentUrl() != null ? sub.getContentUrl() : "";
                    fileId = sub.getFileId();

                    var grade = grades.findBySubmissionId(sub.getId()).orElse(null);
                    if (grade != null && grade.getScore() != null) {
                        score = grade.getScore().toPlainString();
                    }

                    if (fileId != null) {
                        try {
                            var sf = fileService.getById(fileId);
                            fileName = sf.getOriginalFileName();
                        } catch (Exception e) {
                            fileId = null;
                        }
                    }
                }

                csvRows.add(new String[]{
                        String.valueOf(stt), studentCode, studentName,
                        klass.getName(), assignment.getTitle(),
                        assignment.getSkill() != null ? assignment.getSkill() : "",
                        status, submittedAt, fileName, externalLink, score
                });

                if (fileId != null) {
                    fileSeq++;
                    String ext = getExtension(fileName);
                    String safeCode = sanitizeFilenamePart(studentCode.isEmpty() ? "NOCODE" : studentCode);
                    String safeName = sanitizeFilenamePart(studentName);
                    String entryName = String.format("%02d_%s_%s%s", fileSeq, safeCode, safeName, ext);

                    try {
                        Resource resource = fileService.download(fileId);
                        zos.putNextEntry(new ZipEntry(entryName));
                        try (var is = resource.getInputStream()) {
                            is.transferTo(zos);
                        }
                        zos.closeEntry();
                    } catch (Exception e) {
                        // File not found on disk, skip
                    }
                }
            }

            // Write manifest.csv
            zos.putNextEntry(new ZipEntry("manifest.csv"));
            StringBuilder csv = new StringBuilder();
            csv.append("\uFEFF"); // UTF-8 BOM for Excel
            csv.append("stt,studentCode,studentName,className,assignmentTitle,skill,status,submittedAt,fileName,externalLink,score\n");
            for (String[] row : csvRows) {
                for (int i = 0; i < row.length; i++) {
                    if (i > 0) csv.append(",");
                    csv.append(csvEscape(row[i]));
                }
                csv.append("\n");
            }
            zos.write(csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            zos.closeEntry();

        } catch (IOException e) {
            throw BusinessException.badRequest("Không thể tạo file ZIP: " + e.getMessage());
        }

        return baos.toByteArray();
    }

    public String buildExportFilename(UUID assignmentId, UUID classId) {
        Assignment a = assignments.findActiveById(assignmentId).orElse(null);
        if (classId == null && a != null) {
            classId = a.getClassId();
        }
        Klass k = klasses.findById(classId).orElse(null);
        String className = k != null ? sanitizeFilenamePart(k.getName()) : "class";
        String title = a != null ? sanitizeFilenamePart(a.getTitle()) : "assignment";
        return className + "_" + title + "_submissions.zip";
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String sanitizeFilenamePart(String name) {
        if (name == null || name.isBlank()) return "unknown";
        String cleaned = name.replaceAll("[^\\p{L}\\p{N}\\s\\-]", "").replaceAll("\\s+", "_").trim();
        return cleaned.isEmpty() ? "unknown" : cleaned;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
