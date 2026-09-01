package com.hoanobita.topikplatform.classroom;

import com.hoanobita.topikplatform.classroom.dto.*;
import com.hoanobita.topikplatform.common.ApiResponse;
import com.hoanobita.topikplatform.common.SecurityUtils;
import com.hoanobita.topikplatform.user.dto.StatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/classes")
public class ClassroomController {

    private final ClassroomService classroomService;
    private final SecurityUtils securityUtils;

    public ClassroomController(ClassroomService classroomService, SecurityUtils securityUtils) {
        this.classroomService = classroomService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<?> listClasses(@RequestParam(required = false) Integer page,
                                         @RequestParam(required = false) Integer size,
                                         @RequestParam(required = false) String sort,
                                         @RequestParam(required = false) String search,
                                         @RequestParam(required = false) String status) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.listClasses(user, page, size, sort, search, status)));
    }

    @PostMapping
    public ResponseEntity<?> createClass(@Valid @RequestBody CreateClassRequest request) {
        var user = securityUtils.getCurrentUser();
        var result = classroomService.createClass(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(result));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<?> getClass(@PathVariable UUID classId) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.getClassById(classId, user)));
    }

    @PatchMapping("/{classId}")
    public ResponseEntity<?> updateClass(@PathVariable UUID classId, @RequestBody UpdateClassRequest request) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.updateClass(classId, request, user)));
    }

    @DeleteMapping("/{classId}")
    public ResponseEntity<?> deleteClass(@PathVariable UUID classId) {
        var user = securityUtils.getCurrentUser();
        classroomService.deleteClass(classId, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa lớp học"));
    }

    // Admin management
    @PostMapping("/{classId}/admins")
    public ResponseEntity<?> addAdmin(@PathVariable UUID classId, @RequestBody AddMemberRequest request) {
        var user = securityUtils.getCurrentUser();
        classroomService.addAdmin(classId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã phân công quản trị viên"));
    }

    @DeleteMapping("/{classId}/admins/{adminId}")
    public ResponseEntity<?> removeAdmin(@PathVariable UUID classId, @PathVariable UUID adminId) {
        var user = securityUtils.getCurrentUser();
        classroomService.removeAdmin(classId, adminId, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa quản trị viên"));
    }

    // Student management
    @GetMapping("/{classId}/students")
    public ResponseEntity<?> listStudents(@PathVariable UUID classId,
                                          @RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size,
                                          @RequestParam(required = false) String sort,
                                          @RequestParam(required = false) String search,
                                          @RequestParam(required = false) String status) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.listStudents(classId, user, page, size, sort, search, status)));
    }

    @PostMapping("/{classId}/students")
    public ResponseEntity<?> addStudent(@PathVariable UUID classId, @RequestBody AddMemberRequest request) {
        var user = securityUtils.getCurrentUser();
        classroomService.addStudent(classId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã thêm học viên"));
    }

    @PostMapping("/{classId}/students/bulk")
    public ResponseEntity<?> addStudentsBulk(@PathVariable UUID classId, @RequestBody List<UUID> studentIds) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.addStudentsBulk(classId, studentIds, user)));
    }

    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<?> removeStudent(@PathVariable UUID classId, @PathVariable UUID studentId) {
        var user = securityUtils.getCurrentUser();
        classroomService.removeStudent(classId, studentId, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa học viên"));
    }

    @PatchMapping("/{classId}/students/{studentId}/status")
    public ResponseEntity<?> updateStudentStatus(@PathVariable UUID classId, @PathVariable UUID studentId,
                                                  @Valid @RequestBody StatusRequest request) {
        var user = securityUtils.getCurrentUser();
        classroomService.updateStudentStatus(classId, studentId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái học viên thành công"));
    }

    @PatchMapping("/{classId}/students/{studentId}/code")
    public ResponseEntity<?> updateStudentCode(@PathVariable UUID classId, @PathVariable UUID studentId,
                                               @RequestBody StudentCodeRequest request) {
        var user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(classroomService.updateStudentCode(classId, studentId, request, user)));
    }
}
