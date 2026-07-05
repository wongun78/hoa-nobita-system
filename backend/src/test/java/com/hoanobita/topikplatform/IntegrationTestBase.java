package com.hoanobita.topikplatform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.auth.JwtService;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.submission.entity.Submission;
import com.hoanobita.topikplatform.submission.repository.SubmissionRepository;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.RoleRepository;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected JwtService jwtService;
    @Autowired protected PasswordEncoder passwordEncoder;
    @Autowired protected UserRepository userRepository;
    @Autowired protected RoleRepository roleRepository;
    @Autowired protected KlassRepository klassRepository;
    @Autowired protected ClassMemberRepository classMemberRepository;
    @Autowired protected AssignmentRepository assignmentRepository;
    @Autowired protected SubmissionRepository submissionRepository;

    protected User teacher;
    protected User admin;
    protected User student;
    protected Klass testClass;

    protected void setUp() {
        // Clean up data from previous tests
        submissionRepository.deleteAll();
        assignmentRepository.deleteAll();
        classMemberRepository.deleteAll();
        klassRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Create roles
        Role teacherRole = roleRepository.save(new Role(RoleName.TEACHER_OWNER));
        Role adminRole = roleRepository.save(new Role(RoleName.CLASS_ADMIN));
        Role studentRole = roleRepository.save(new Role(RoleName.STUDENT));

        // Create users
        teacher = createUser("Teacher User", "teacher@test.com", "0900000001", teacherRole);
        admin = createUser("Admin User", "admin@test.com", "0900000002", adminRole);
        student = createUser("Student User", "student@test.com", "0900000003", studentRole);

        // Create a class taught by teacher
        testClass = new Klass();
        testClass.setName("Test Class");
        testClass.setCode("TC-" + UUID.randomUUID().toString().substring(0, 6));
        testClass.setTeacherId(teacher.getId());
        testClass.setStatus(ClassStatus.ACTIVE);
        testClass = klassRepository.save(testClass);

        // Add student to class
        ClassMember member = new ClassMember();
        member.setClassId(testClass.getId());
        member.setStudentId(student.getId());
        member.setStatus(MemberStatus.ACTIVE);
        classMemberRepository.save(member);
    }

    protected User createUser(String name, String email, String phone, Role... roles) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode("Password1"));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(roles));
        return userRepository.save(user);
    }

    protected String authHeader(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }

    protected Assignment createAssignment(UUID classId, String title) {
        Assignment a = new Assignment();
        a.setClassId(classId);
        a.setTitle(title);
        a.setMaxScore(BigDecimal.TEN);
        a.setStatus(AssignmentStatus.PUBLISHED);
        return assignmentRepository.save(a);
    }

    protected Submission createSubmission(UUID assignmentId, UUID studentId, SubmissionStatus status) {
        Submission s = new Submission();
        s.setAssignmentId(assignmentId);
        s.setStudentId(studentId);
        s.setContentText("Test submission");
        s.setStatus(status);
        return submissionRepository.save(s);
    }
}
