package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.assignment.entity.Assignment;
import com.hoanobita.topikplatform.assignment.repository.AssignmentRepository;
import com.hoanobita.topikplatform.classroom.entity.ClassAdmin;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.Enums.*;
import com.hoanobita.topikplatform.lesson.entity.Lesson;
import com.hoanobita.topikplatform.lesson.repository.LessonRepository;
import com.hoanobita.topikplatform.user.entity.Role;
import com.hoanobita.topikplatform.user.entity.User;
import com.hoanobita.topikplatform.user.repository.RoleRepository;
import com.hoanobita.topikplatform.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String DEFAULT_PASSWORD = "Password123!";
    private static final String DOMAIN = "hoanobita.edu.vn";

    private final EntityManager em;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final KlassRepository klassRepo;
    private final ClassMemberRepository classMemberRepo;
    private final ClassAdminRepository classAdminRepo;
    private final LessonRepository lessonRepo;
    private final AssignmentRepository assignmentRepo;
    private final PasswordEncoder encoder;

    public DevDataSeeder(EntityManager em, UserRepository userRepo, RoleRepository roleRepo,
                         KlassRepository klassRepo, ClassMemberRepository classMemberRepo,
                         ClassAdminRepository classAdminRepo,
                         LessonRepository lessonRepo, AssignmentRepository assignmentRepo,
                         PasswordEncoder encoder) {
        this.em = em;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.klassRepo = klassRepo;
        this.classMemberRepo = classMemberRepo;
        this.classAdminRepo = classAdminRepo;
        this.lessonRepo = lessonRepo;
        this.assignmentRepo = assignmentRepo;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== DevDataSeeder START ===");

        // Step 1: Delete all data in FK-safe order
        deleteAllData();

        // Step 2: Seed roles
        Role teacherRole = seedRole(RoleName.TEACHER_OWNER);
        Role adminRole = seedRole(RoleName.CLASS_ADMIN);
        Role studentRole = seedRole(RoleName.STUDENT);

        // Step 3: Seed users
        User teacher = seedUser("Trần Thị Hoà", "hoateacher", "0900000000", teacherRole);
        User adminKien = seedUser("Nguyễn Kiên", "kienadmin", "0900000001", adminRole);
        User adminQuan = seedUser("Nguyễn Quân", "quanadmin", "0900000002", adminRole);

        // Step 4: Seed students
        List<User> demStudents = seedDemStudents(studentRole);
        List<User> chieuStudents = seedChieuStudents(studentRole);

        // Step 5: Seed classes
        Klass demClass = seedClass("TOPIK 3,4 ĐÊM", "TOPIC34DEM", "Lớp TOPIK 3,4 ca Đêm",
                teacher.getId(), 3, 4, LocalDate.of(2025, 1, 6), LocalDate.of(2025, 6, 30));
        Klass chieuClass = seedClass("TOPIK 3,4 CHIỀU", "TOPIC34CHIEU", "Lớp TOPIK 3,4 ca Chiều",
                teacher.getId(), 3, 4, LocalDate.of(2025, 1, 6), LocalDate.of(2025, 6, 30));

        // Step 6: Seed class members
        seedClassMembers(demClass, demStudents, "D");
        seedClassMembers(chieuClass, chieuStudents, "C");

        // Step 6b: Seed admin-class assignments
        seedClassAdmin(demClass, adminKien);
        seedClassAdmin(chieuClass, adminQuan);

        // Step 7: Seed lessons (3 per class)
        List<Lesson> demLessons = seedLessons(demClass);
        List<Lesson> chieuLessons = seedLessons(chieuClass);

        // Step 8: Seed assignments (3 per class, linked to lessons)
        List<Assignment> demAssignments = seedAssignments(demClass, demLessons);
        List<Assignment> chieuAssignments = seedAssignments(chieuClass, chieuLessons);

        log.info("=== DevDataSeeder DONE ===");
        log.info("Summary:");
        log.info("  Users: 1 teacher + 2 admins + {} students = {} total",
                demStudents.size() + chieuStudents.size(),
                3 + demStudents.size() + chieuStudents.size());
        log.info("  Classes: 2 (TOPIK 3,4 ĐÊM, TOPIK 3,4 CHIỀU)");
        log.info("  Class members: {} + {} = {}",
                demStudents.size(), chieuStudents.size(),
                demStudents.size() + chieuStudents.size());
        log.info("  Lessons: 6 (3 per class)");
        log.info("  Assignments: 6 (3 per class)");
        log.info("  Login: hoateacher, kienadmin, quanadmin, d01-d34, c01-c28 / {}", DEFAULT_PASSWORD);
    }

    private void deleteAllData() {
        log.info("Deleting all existing data...");
        // FK-safe delete order
        em.createNativeQuery("DELETE FROM grades").executeUpdate();
        em.createNativeQuery("DELETE FROM submissions").executeUpdate();
        em.createNativeQuery("DELETE FROM attendance").executeUpdate();
        em.createNativeQuery("DELETE FROM notifications").executeUpdate();
        em.createNativeQuery("DELETE FROM activity_logs").executeUpdate();
        em.createNativeQuery("DELETE FROM materials").executeUpdate();
        em.createNativeQuery("DELETE FROM assignments").executeUpdate();
        em.createNativeQuery("DELETE FROM lessons").executeUpdate();
        em.createNativeQuery("DELETE FROM class_members").executeUpdate();
        em.createNativeQuery("DELETE FROM class_admins").executeUpdate();
        em.createNativeQuery("DELETE FROM files").executeUpdate();
        em.createNativeQuery("DELETE FROM classes").executeUpdate();
        em.createNativeQuery("DELETE FROM user_roles").executeUpdate();
        em.createNativeQuery("DELETE FROM users").executeUpdate();
        log.info("All data deleted.");
    }

    private Role seedRole(RoleName name) {
        return roleRepo.findByName(name).orElseGet(() -> {
            Role r = new Role();
            r.setName(name);
            return roleRepo.save(r);
        });
    }

    private User seedUser(String fullName, String username, String phone, Role role) {
        String email = username.toLowerCase() + "@" + DOMAIN;
        return userRepo.findByEmailOrPhone(email).orElseGet(() -> {
            User u = new User();
            u.setFullName(fullName);
            u.setEmail(email);
            u.setPhone(phone);
            u.setPasswordHash(encoder.encode(DEFAULT_PASSWORD));
            u.setStatus(UserStatus.ACTIVE);
            u.setFirstLogin(false);
            u.setRoles(Set.of(role));
            return userRepo.save(u);
        });
    }

    private User seedStudent(String fullName, String username, String phone, String dob, Role role) {
        String email = username.toLowerCase() + "@" + DOMAIN;
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(encoder.encode(DEFAULT_PASSWORD));
        u.setStatus(UserStatus.ACTIVE);
        u.setFirstLogin(false);
        u.setRoles(Set.of(role));
        return userRepo.save(u);
    }

    // ===== ĐÊM students (D01-D34) =====
    private List<User> seedDemStudents(Role role) {
        log.info("Seeding {} ĐÊM students...", 34);
        List<User> students = new ArrayList<>();
        // index 0=D01, 1=D02, ... so D## = index+1
        String[][] data = {
            {"Bùi Nguyễn Nhật Hào", "0394150834", ""},
            {"Lê Thanh Tú", "0335963698", ""},
            {"Phạm Thị Trang", "0385926045", ""},
            {"Nguyễn Thị Thùy Trang", "0347855355", ""},
            {"Nguyễn Thị Thanh Hằng", "0961183795", ""},
            {"Phan Thị Thuý Hằng", "0372149748", ""},
            {"Trần Thị Kiều Oanh", "0862132488", ""},
            {"Lê Thị Lan Anh", "0367878862", ""},
            {"Lê Thị Hằng Nga", "0967754557", ""},
            {"Nguyễn Văn Lượng", "0398457690", ""},
            {"Nguyễn Thị Thu Hằng", "0972030383", ""},
            {"Phạm Thị Thu Hằng", "0988858792", ""},
            {"Đặng Thị Thanh Hằng", "0972749887", ""},
            {"Trịnh Thị Thuý", "0382912970", ""},
            {"Phạm Thị Thu Trang", "0974694299", ""},
            {"Tạ Thị Kim Cương", "0862604836", ""},
            {"Trần Thị Thu Hường", "0971773215", ""},
            {"Bùi Văn Tùng", "0913030968", ""},
            {"Nguyễn Thị Thúy Nga", "0352687079", ""},
            {"Lê Thị Yến", "0974083598", ""},
            {"Nguyễn Thị Nga", "0344789765", ""},
            {"Nguyễn Thị Hiền", "0983336350", ""},
            {"Lê Thanh Thuỷ", "0383771598", ""},
            {"Đoàn Thị Thu Hằng", "0343798567", ""},
            {"Nguyễn Thị Hằng", "0964735127", ""},
            {"Nguyễn Thị Thuý Hằng", "0336510278", ""},
            {"Trần Thị Thanh Hoa", "0385969088", ""},
            {"Hoàng Thị Thu Hà", "0988107567", ""},
            {"Phạm Thị Hà", "0867084247", ""},
            {"Trịnh Thị Nhung", "0968854078", ""},
            {"Phan Thị Tuyết", "0964752628", ""},
            {"Nguyễn Thị Dung", "0962195927", ""},
            {"Trần Thanh Tùng", "0968634981", ""},
            {"Trịnh Thị Thuỷ", "0387287498", ""},
        };
        for (int i = 0; i < data.length; i++) {
            String code = String.format("D%02d", i + 1);
            String username = code.toLowerCase();
            students.add(seedStudent(data[i][0], username, data[i][1], data[i][2], role));
        }
        log.info("  → {} ĐÊM students created", students.size());
        return students;
    }

    // ===== CHIỀU students (C01-C28) =====
    private List<User> seedChieuStudents(Role role) {
        log.info("Seeding {} CHIỀU students...", 28);
        List<User> students = new ArrayList<>();
        String[][] data = {
            {"Lê Thị Thùy Trang", "0372660769", "19/06/1999"},
            {"Đinh Thị Thanh Hoa", "0382224456", "02/02/1998"},
            {"Trần Thị Thu Hường", "0389638401", "20/11/1995"},
            {"Lê Thị Thu Trang", "0335084429", "26/04/2001"},
            {"Đoàn Thị Thu Hằng", "0966017797", ""},
            {"Phạm Thị Dung", "0867968057", "24/12/1998"},
            {"Nguyễn Thị Tuyết", "0966937840", "07/07/2001"},
            {"Nguyễn Thị Thu Hằng", "0384871838", ""},
            {"Hoàng Thị Hoa", "0349242612", "11/10/1997"},
            {"Lê Thị Thuý", "0336865950", ""},
            {"Vũ Thị Thu Hường", "0336944632", ""},
            {"Trần Thị Thu Trang", "0967615907", "25/07/1999"},
            {"Lê Thị Thanh Trà", "0389068659", "15/12/1998"},
            {"Phạm Thị Hằng", "0338379632", "10/04/1997"},
            {"Vũ Thị Thanh Hằng", "0339356263", "24/02/2000"},
            {"Nguyễn Thị Thu Hà", "0356812906", "15/04/1997"},
            {"Phạm Thị Trang", "0398642829", ""},
            {"Nguyễn Thị Thanh Hằng", "0372725298", ""},
            {"Nguyễn Thị Thu Trang", "0968902100", ""},
            {"Lê Thị Dung", "0336711509", ""},
            {"Lê Thị Thu Trang", "0342378287", "27/02/1999"},
            {"Trần Thu Trang", "0342877577", ""},
            {"Lê Thị Kim Thoa", "0345269839", "28/02/1996"},
            {"Phạm Thị Kim Thoa", "0382448639", ""},
            {"Trần Thị Thanh Hằng", "0374517654", ""},
            {"Phan Thị Thu Hằng", "0968375340", ""},
            {"Lê Thị Thu Hằng", "0386829148", ""},
            {"Đoàn Thị Hằng", "0982120535", ""},
        };
        for (int i = 0; i < data.length; i++) {
            String code = String.format("C%02d", i + 1);
            String username = code.toLowerCase();
            students.add(seedStudent(data[i][0], username, data[i][1], data[i][2], role));
        }
        log.info("  → {} CHIỀU students created", students.size());
        return students;
    }

    private Klass seedClass(String name, String code, String desc, UUID teacherId,
                            int levelFrom, int levelTo, LocalDate start, LocalDate end) {
        Klass k = new Klass();
        k.setName(name);
        k.setCode(code);
        k.setDescription(desc);
        k.setTeacherId(teacherId);
        k.setLevelFrom(levelFrom);
        k.setLevelTo(levelTo);
        k.setStatus(ClassStatus.ACTIVE);
        k.setStartDate(start);
        k.setEndDate(end);
        return klassRepo.save(k);
    }

    private void seedClassMembers(Klass klass, List<User> students, String prefix) {
        log.info("Seeding {} class members for {}...", students.size(), klass.getName());
        for (int i = 0; i < students.size(); i++) {
            String code = String.format("%s%02d", prefix, i + 1);
            ClassMember cm = new ClassMember();
            cm.setClassId(klass.getId());
            cm.setStudentId(students.get(i).getId());
            cm.setStudentCode(code);
            cm.setStatus(MemberStatus.ACTIVE);
            cm.setJoinedAt(Instant.now());
            classMemberRepo.save(cm);
        }
        log.info("  → {} members added to {}", students.size(), klass.getName());
    }

    private void seedClassAdmin(Klass klass, User admin) {
        ClassAdmin ca = new ClassAdmin(klass.getId(), admin.getId());
        classAdminRepo.save(ca);
        log.info("  → {} assigned as admin of {}", admin.getFullName(), klass.getName());
    }

    private List<Lesson> seedLessons(Klass klass) {
        log.info("Seeding 3 lessons for {}...", klass.getName());
        LocalDate baseDate = klass.getStartDate().plusDays(3); // first lesson a few days after start
        List<Lesson> lessons = new ArrayList<>();
        String[] titles = {
            "Bài 1: 자기소개 (Giới thiệu bản thân)",
            "Bài 2: 일상생활 (Cuộc sống hàng ngày)",
            "Bài 3: 약속 & 시간 (Hẹn & Giờ)"
        };
        for (int i = 0; i < 3; i++) {
            Lesson l = new Lesson();
            l.setClassId(klass.getId());
            l.setTitle(titles[i]);
            l.setDescription("Nội dung bài học " + (i + 1) + " lớp " + klass.getName());
            l.setLessonDate(baseDate.plusDays(i * 7L));
            l.setOrderIndex(i + 1);
            l.setStatus(LessonStatus.PUBLISHED);
            lessons.add(lessonRepo.save(l));
        }
        log.info("  → 3 lessons created for {}", klass.getName());
        return lessons;
    }

    private List<Assignment> seedAssignments(Klass klass, List<Lesson> lessons) {
        log.info("Seeding 3 assignments for {}...", klass.getName());
        List<Assignment> assignments = new ArrayList<>();
        String[] titles = {
            "Bài tập Từ vựng 1-2",
            "Bài tập Từ vựng 3-4",
            "Bài tập Từ vựng 5-6"
        };
        String[] descriptions = {
            "Ôn tập từ vựng bài 1-2: học thuộc, viết lại, đặt câu.",
            "Ôn tập từ vựng bài 3-4: học thuộc, viết lại, đặt câu.",
            "Ôn tập từ vựng bài 5-6: học thuộc, viết lại, đặt câu."
        };
        for (int i = 0; i < 3; i++) {
            Assignment a = new Assignment();
            a.setClassId(klass.getId());
            a.setLessonId(lessons.get(i).getId());
            a.setTitle(titles[i]);
            a.setDescription(descriptions[i]);
            a.setInstruction("Học thuộc từ vựng, viết lại 3 lần mỗi từ, đặt 1 câu cho mỗi từ mới.");
            a.setSkill("Từ vựng");
            a.setMaxScore(new BigDecimal("100"));
            a.setStatus(AssignmentStatus.PUBLISHED);
            a.setAllowResubmit(true);
            a.setDueAt(lessons.get(i).getLessonDate().plusDays(5).atStartOfDay(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant());
            assignments.add(assignmentRepo.save(a));
        }
        log.info("  → 3 assignments created for {}", klass.getName());
        return assignments;
    }
}
