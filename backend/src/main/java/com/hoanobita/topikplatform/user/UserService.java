package com.hoanobita.topikplatform.user;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.RoleName;
import com.hoanobita.topikplatform.common.Enums.UserStatus;
import com.hoanobita.topikplatform.grading.entity.Grade;
import com.hoanobita.topikplatform.grading.repository.GradeRepository;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.dto.*;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.RoleRepository;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ClassMemberRepository classMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;
    private final ActivityService activityService;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder,
                       ClassMemberRepository classMemberRepository, AssignmentRepository assignmentRepository,
                       SubmissionRepository submissionRepository, GradeRepository gradeRepository, ActivityService activityService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.classMemberRepository = classMemberRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.gradeRepository = gradeRepository;
        this.activityService = activityService;
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAllActive().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse getUserById(UUID id) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        return toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request, User currentUser) {
        // Validate email or phone required
        if ((request.email() == null || request.email().isBlank()) &&
            (request.phone() == null || request.phone().isBlank())) {
            throw BusinessException.badRequest("Email or phone is required");
        }

        // Validate email format if provided
        if (request.email() != null && !request.email().isBlank()) {
            if (!request.email().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
                throw BusinessException.badRequest("Invalid email format");
            }
            if (userRepository.existsByEmail(request.email())) {
                throw BusinessException.conflict("Email already exists");
            }
        }

        // Validate phone uniqueness if provided
        if (request.phone() != null && !request.phone().isBlank()) {
            if (userRepository.existsByPhone(request.phone())) {
                throw BusinessException.conflict("Phone already exists");
            }
        }

        // Parse role
        RoleName roleName;
        try {
            roleName = RoleName.valueOf(request.role());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid role: " + request.role());
        }

        // Admin can only create students
        if (currentUser.isAdmin() && !currentUser.isTeacher() && roleName != RoleName.STUDENT) {
            throw BusinessException.forbidden("Admin can only create students");
        }

        var role = roleRepository.findByName(roleName)
                .orElseThrow(() -> BusinessException.notFound("Role not found"));

        // Generate temporary password
        String tempPassword = "TempPass" + UUID.randomUUID().toString().substring(0, 6) + "!";

        var user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email() != null && !request.email().isBlank() ? request.email() : null);
        user.setPhone(request.phone() != null && !request.phone().isBlank() ? request.phone() : null);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setFirstLogin(true);
        user.setNote(request.note());
        user.setCreatedBy(currentUser.getId());
        user.getRoles().add(role);

        user = userRepository.save(user);

        activityService.log("USER_CREATED", "USER", user.getId(), user.getFullName(), null, "Đã tạo người dùng mới: " + user.getFullName());

        var resp = toResponse(user);
        // Return with temporary password for dev/local
        return new UserResponse(
                resp.id(), resp.fullName(), resp.email(), resp.phone(),
                resp.status(), resp.firstLogin(), resp.avatarUrl(), resp.note(),
                resp.roles(), resp.createdAt(), tempPassword
        );
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.email() != null) {
            if (!request.email().equals(user.getEmail()) && userRepository.existsByEmail(request.email())) {
                throw BusinessException.conflict("Email already exists");
            }
            user.setEmail(request.email());
        }
        if (request.phone() != null) {
            if (!request.phone().equals(user.getPhone()) && userRepository.existsByPhone(request.phone())) {
                throw BusinessException.conflict("Phone already exists");
            }
            user.setPhone(request.phone());
        }
        if (request.note() != null) user.setNote(request.note());

        user = userRepository.save(user);
        activityService.log("USER_UPDATED", "USER", user.getId(), user.getFullName(), null, "Đã cập nhật thông tin người dùng: " + user.getFullName());
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateStatus(UUID id, StatusRequest request) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));

        UserStatus status;
        try {
            status = UserStatus.valueOf(request.status());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid status: " + request.status());
        }

        user.setStatus(status);
        user = userRepository.save(user);
        activityService.log("USER_STATUS_CHANGED", "USER", user.getId(), user.getFullName(), null, "Đã thay đổi trạng thái người dùng " + user.getFullName() + " thành " + status.name());
        return toResponse(user);
    }

    @Transactional
    public void deleteUser(UUID id) {
        var user = userRepository.findActiveById(id)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        user.softDelete();
        userRepository.save(user);
        activityService.log("USER_DELETED", "USER", user.getId(), user.getFullName(), null, "Đã xóa người dùng: " + user.getFullName());
    }

    public StudentProgressResponse getStudentProgress(UUID studentId) {
        var user = userRepository.findActiveById(studentId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        
        if (!user.isStudent()) {
            throw BusinessException.badRequest("User is not a student");
        }

        // 1. Find all classes the student is enrolled in
        List<UUID> classIds = classMemberRepository.findClassIdsByStudentId(studentId);
        
        if (classIds.isEmpty()) {
            return new StudentProgressResponse(0, 0, 0, BigDecimal.ZERO, "LOW");
        }

        // 2. Find all assignments for those classes
        List<Assignment> assignments = assignmentRepository.findByClassIdIn(classIds);
        int totalAssignments = assignments.size();

        if (totalAssignments == 0) {
            return new StudentProgressResponse(0, 0, 0, BigDecimal.ZERO, "LOW");
        }

        // 3. Find all submissions by the student
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        int submittedAssignments = submissions.size();

        // 4. Find all grades for those submissions
        List<Grade> grades = gradeRepository.findByStudentId(studentId);
        int gradedAssignments = grades.size();

        // 5. Calculate average score (percentage)
        BigDecimal averageScore = BigDecimal.ZERO;
        if (gradedAssignments > 0) {
            BigDecimal totalPercentage = BigDecimal.ZERO;
            for (Grade grade : grades) {
                // Find the corresponding assignment to get maxScore
                Submission submission = submissions.stream()
                        .filter(s -> s.getId().equals(grade.getSubmissionId()))
                        .findFirst()
                        .orElse(null);
                
                if (submission != null) {
                    Assignment assignment = assignments.stream()
                            .filter(a -> a.getId().equals(submission.getAssignmentId()))
                            .findFirst()
                            .orElse(null);
                            
                    if (assignment != null && assignment.getMaxScore().compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal percentage = grade.getScore()
                                .divide(assignment.getMaxScore(), 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal("100"));
                        totalPercentage = totalPercentage.add(percentage);
                    }
                }
            }
            averageScore = totalPercentage.divide(new BigDecimal(gradedAssignments), 2, RoundingMode.HALF_UP);
        }

        // 6. Determine risk level
        // HIGH: < 50% submission rate OR < 50% average score
        // MEDIUM: 50-75% submission rate OR 50-70% average score
        // LOW: > 75% submission rate AND > 70% average score
        String riskLevel = "LOW";
        
        double submissionRate = (double) submittedAssignments / totalAssignments;
        double avgScoreDouble = averageScore.doubleValue();
        
        if (submissionRate < 0.5 || (gradedAssignments > 0 && avgScoreDouble < 50.0)) {
            riskLevel = "HIGH";
        } else if (submissionRate <= 0.75 || (gradedAssignments > 0 && avgScoreDouble <= 70.0)) {
            riskLevel = "MEDIUM";
        }

        return new StudentProgressResponse(
                totalAssignments,
                submittedAssignments,
                gradedAssignments,
                averageScore,
                riskLevel
        );
    }

    private UserResponse toResponse(User user) {
        var roles = user.getRoles().stream().map(r -> r.getName().name()).toList();
        return new UserResponse(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getStatus().name(), user.isFirstLogin(), user.getAvatarUrl(),
                user.getNote(), roles, user.getCreatedAt()
        );
    }
}
