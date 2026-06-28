package com.hoanobita.topikplatform.classroom;

import com.hoanobita.topikplatform.activity.ActivityService;
import com.hoanobita.topikplatform.classroom.dto.*;
import com.hoanobita.topikplatform.classroom.entity.*;
import com.hoanobita.topikplatform.classroom.repository.*;
import com.hoanobita.topikplatform.common.BusinessException;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.common.PermissionService;
import com.hoanobita.topikplatform.user.dto.StatusRequest;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClassroomService {

    private final KlassRepository klassRepo;
    private final ClassAdminRepository classAdminRepo;
    private final ClassMemberRepository classMemberRepo;
    private final UserRepository userRepo;
    private final PermissionService permissionService;
    private final ActivityService activityService;

    public ClassroomService(KlassRepository klassRepo, ClassAdminRepository classAdminRepo,
                            ClassMemberRepository classMemberRepo, UserRepository userRepo,
                            PermissionService permissionService, ActivityService activityService) {
        this.klassRepo = klassRepo;
        this.classAdminRepo = classAdminRepo;
        this.classMemberRepo = classMemberRepo;
        this.userRepo = userRepo;
        this.permissionService = permissionService;
        this.activityService = activityService;
    }

    public List<ClassResponse> listClasses(User currentUser) {
        List<Klass> classes;
        if (currentUser.isTeacher()) {
            classes = klassRepo.findAllActive();
        } else if (currentUser.isAdmin()) {
            var classIds = classAdminRepo.findClassIdsByAdminId(currentUser.getId());
            classes = klassRepo.findAllActive().stream()
                    .filter(k -> classIds.contains(k.getId()))
                    .toList();
        } else {
            // Student
            var classIds = classMemberRepo.findClassIdsByStudentId(currentUser.getId());
            classes = klassRepo.findAllActive().stream()
                    .filter(k -> classIds.contains(k.getId()))
                    .toList();
        }
        return classes.stream().map(this::toResponse).toList();
    }

    public ClassResponse getClassById(UUID classId, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Class not found"));
        permissionService.requireAccessClass(currentUser, classId);
        return toResponse(klass);
    }

    @Transactional
    public ClassResponse createClass(CreateClassRequest request, User currentUser) {
        permissionService.requireTeacher(currentUser);

        if (klassRepo.existsByCode(request.code())) {
            throw BusinessException.conflict("Class code already exists");
        }

        if (request.levelFrom() != null && request.levelTo() != null && request.levelFrom() > request.levelTo()) {
            throw BusinessException.badRequest("level_from must be <= level_to");
        }

        var klass = new Klass();
        klass.setName(request.name());
        klass.setCode(request.code());
        klass.setDescription(request.description());
        klass.setLevelFrom(request.levelFrom());
        klass.setLevelTo(request.levelTo());
        klass.setTeacherId(currentUser.getId());
        klass.setCreatedBy(currentUser.getId());
        if (request.startDate() != null) klass.setStartDate(LocalDate.parse(request.startDate()));
        if (request.endDate() != null) klass.setEndDate(LocalDate.parse(request.endDate()));

        klass = klassRepo.save(klass);
        activityService.log("CLASS_CREATED", "CLASS", klass.getId(), klass.getName(), klass.getId(), "Đã tạo lớp học mới: " + klass.getName());
        return toResponse(klass);
    }

    @Transactional
    public ClassResponse updateClass(UUID classId, UpdateClassRequest request, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Class not found"));
        permissionService.requireManageClass(currentUser, classId);

        if (request.name() != null) klass.setName(request.name());
        if (request.description() != null) klass.setDescription(request.description());
        if (request.levelFrom() != null) klass.setLevelFrom(request.levelFrom());
        if (request.levelTo() != null) klass.setLevelTo(request.levelTo());

        if (request.levelFrom() != null && request.levelTo() != null && request.levelFrom() > request.levelTo()) {
            throw BusinessException.badRequest("level_from must be <= level_to");
        }

        if (request.status() != null) {
            try {
                klass.setStatus(ClassStatus.valueOf(request.status()));
            } catch (IllegalArgumentException e) {
                throw BusinessException.badRequest("Invalid status: " + request.status());
            }
        }
        if (request.startDate() != null) klass.setStartDate(LocalDate.parse(request.startDate()));
        if (request.endDate() != null) klass.setEndDate(LocalDate.parse(request.endDate()));

        klass.setUpdatedBy(currentUser.getId());
        klass = klassRepo.save(klass);
        activityService.log("CLASS_UPDATED", "CLASS", klass.getId(), klass.getName(), klass.getId(), "Đã cập nhật thông tin lớp học: " + klass.getName());
        return toResponse(klass);
    }

    @Transactional
    public void deleteClass(UUID classId, User currentUser) {
        var klass = klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Class not found"));
        permissionService.requireTeacher(currentUser);
        klass.softDelete();
        klassRepo.save(klass);
        activityService.log("CLASS_DELETED", "CLASS", klass.getId(), klass.getName(), klass.getId(), "Đã xóa lớp học: " + klass.getName());
    }

    // --- Admin management ---

    @Transactional
    public void addAdmin(UUID classId, AddMemberRequest request, User currentUser) {
        permissionService.requireTeacher(currentUser);
        klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Class not found"));

        UUID adminId = request.resolvedAdminId();
        if (adminId == null) throw BusinessException.badRequest("adminId is required");

        var admin = userRepo.findActiveById(adminId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        if (!admin.isAdmin()) throw BusinessException.badRequest("User must have CLASS_ADMIN role");

        if (classAdminRepo.existsByClassIdAndAdminId(classId, adminId)) {
            throw BusinessException.conflict("Admin already assigned to this class");
        }

        classAdminRepo.save(new ClassAdmin(classId, adminId));
        activityService.log("CLASS_ADMIN_ADDED", "USER", adminId, admin.getFullName(), classId, "Đã thêm trợ giảng " + admin.getFullName() + " vào lớp");
    }

    @Transactional
    public void removeAdmin(UUID classId, UUID adminId, User currentUser) {
        permissionService.requireTeacher(currentUser);
        var admin = userRepo.findActiveById(adminId).orElse(null);
        classAdminRepo.deleteByClassIdAndAdminId(classId, adminId);
        if (admin != null) {
            activityService.log("CLASS_ADMIN_REMOVED", "USER", adminId, admin.getFullName(), classId, "Đã xóa trợ giảng " + admin.getFullName() + " khỏi lớp");
        }
    }

    // --- Student management ---

    @Transactional
    public void addStudent(UUID classId, AddMemberRequest request, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        klassRepo.findActiveById(classId)
                .orElseThrow(() -> BusinessException.notFound("Class not found"));

        UUID studentId = request.resolvedStudentId();
        if (studentId == null) throw BusinessException.badRequest("studentId is required");

        var student = userRepo.findActiveById(studentId)
                .orElseThrow(() -> BusinessException.notFound("User not found"));
        if (!student.isStudent()) throw BusinessException.badRequest("User must have STUDENT role");

        var existing = classMemberRepo.findByClassIdAndStudentId(classId, studentId);
        if (existing.isPresent()) {
            var member = existing.get();
            if (member.getStatus() == MemberStatus.ACTIVE) {
                throw BusinessException.conflict("Student already in this class");
            }
            // Re-activate if previously removed
            member.setStatus(MemberStatus.ACTIVE);
            member.setRemovedAt(null);
            classMemberRepo.save(member);
        } else {
            var member = new ClassMember();
            member.setClassId(classId);
            member.setStudentId(studentId);
            member.setStatus(MemberStatus.ACTIVE);
            classMemberRepo.save(member);
        }
        activityService.log("CLASS_STUDENT_ADDED", "USER", studentId, student.getFullName(), classId, "Đã thêm học viên " + student.getFullName() + " vào lớp");
    }

    @Transactional
    public void removeStudent(UUID classId, UUID studentId, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        var member = classMemberRepo.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> BusinessException.notFound("Student not in this class"));
        
        member.setStatus(MemberStatus.REMOVED);
        member.setRemovedAt(Instant.now());
        classMemberRepo.save(member);
        
        var student = userRepo.findActiveById(studentId).orElse(null);
        if (student != null) {
            activityService.log("CLASS_STUDENT_REMOVED", "USER", studentId, student.getFullName(), classId, "Đã xóa học viên " + student.getFullName() + " khỏi lớp");
        }
    }

    @Transactional
    public void updateStudentStatus(UUID classId, UUID studentId, StatusRequest request, User currentUser) {
        permissionService.requireManageClass(currentUser, classId);
        var member = classMemberRepo.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> BusinessException.notFound("Student not in class"));
        try {
            member.setStatus(MemberStatus.valueOf(request.status()));
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Invalid status: " + request.status());
        }
        classMemberRepo.save(member);
    }

    public List<StudentMemberResponse> listStudents(UUID classId, User currentUser) {
        permissionService.requireAccessClass(currentUser, classId);
        var members = classMemberRepo.findByClassIdAndStatus(classId, MemberStatus.ACTIVE);
        return members.stream().map(m -> {
            var student = userRepo.findById(m.getStudentId()).orElse(null);
            String name = student != null ? student.getFullName() : "Unknown";
            String email = student != null ? student.getEmail() : null;
            return new StudentMemberResponse(m.getStudentId(), name, email, m.getStatus().name(), m.getJoinedAt());
        }).toList();
    }

    private ClassResponse toResponse(Klass klass) {
        var teacher = userRepo.findById(klass.getTeacherId()).orElse(null);
        String teacherName = teacher != null ? teacher.getFullName() : "Unknown";

        var admins = classAdminRepo.findByClassId(klass.getId()).stream()
                .map(ca -> {
                    var admin = userRepo.findById(ca.getAdminId()).orElse(null);
                    String name = admin != null ? admin.getFullName() : "Unknown";
                    return new ClassResponse.AdminInfo(ca.getAdminId(), name);
                })
                .toList();

        int studentCount = classMemberRepo.findByClassIdAndStatus(klass.getId(), MemberStatus.ACTIVE).size();

        return new ClassResponse(
                klass.getId(), klass.getName(), klass.getCode(), klass.getDescription(),
                klass.getLevelFrom(), klass.getLevelTo(), klass.getStatus().name(),
                klass.getTeacherId(), teacherName, klass.getStartDate(), klass.getEndDate(),
                studentCount, admins, klass.getCreatedAt()
        );
    }

    public record StudentMemberResponse(UUID id, String fullName, String email, String status, Instant joinedAt) {}
}
