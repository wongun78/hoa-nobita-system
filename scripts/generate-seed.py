#!/usr/bin/env python3
"""Generate DevDataSeeder.java and credentials.md from real student data."""

import random
import string

# ===== CLASS DEFINITIONS =====
classes = [
    {
        "name": "LỚP LUYỆN ĐỀ",
        "code": "LD",
        "desc": "Lớp Luyện Đề",
        "level_from": 3,
        "level_to": 6,
        "student_prefix": "L",
        "admins": ["quanadmin", "kienadmin"],  # Quân + Kiên
        "students": [
            ("Nguyễn Thị Thu An",),
            ("Nguyễn Văn Khánh",),
            ("Đoàn Thanh Huyền",),
            ("Lương Thị Yến Nhi",),
            ("Trần Thị Hạnh",),
            ("Âu Ngọc Minh Châu",),
            ("Lê Trường Sinh",),
            ("Nguyễn Thị Hiếu Ngân",),
            ("Phùng Thuỳ Dung",),
            ("Dương Thuỳ Linh",),
            ("Dương Thu Huyền",),
            ("Trần Thị Lan Anh",),
            ("Nguyễn Thị Hường",),
            ("Nguyễn Ngọc Quyên",),
            ("Nguyễn Thị Kim Ánh",),
            ("Cao Văn Trường",),
            ("Nguyễn Phương Khánh",),
            ("Lê Thị Phương Chi",),
            ("Tạ Thị Duật",),
            ("Trần Hồng Hạnh",),
            ("Lê Lan Hương",),
            ("Phạm Thanh Hằng",),
            ("Dương Hoàng Vy",),
            ("Nguyễn Thị Hồng Thắm",),
            ("Trần Ngọc Bảo Hoàng",),
            ("Phạm Thị Hồng Hạnh",),
            ("Ngô Thanh Huyền",),
            ("Nguyễn Duy Hoàng",),
            ("Lê Thị Thu Hồng",),
            ("Nguyễn Thị Quỳnh Anh",),
        ]
    },
    {
        "name": "TOPIK 3, 4 ĐÊM",
        "code": "D34",
        "desc": "Lớp TOPIK 3,4 ca Đêm",
        "level_from": 3,
        "level_to": 4,
        "student_prefix": "D",
        "admins": ["kienadmin"],
        "students": [
            ("Nguyễn Quang Huy",),
            ("Võ Thị Bảo Nhi",),
            ("Chu Thị Lan Hương",),
            ("Đặng Thị Nhi",),
            ("Trần Thanh Bình",),
            ("Phạm Thị Hồng Hạnh",),
            ("Nguyễn Việt Chinh",),
            ("Vũ Thị Ngọc Hậu",),
            ("Phạm Quỳnh Mai",),
            ("Dương Thị Ngọc Anh",),
            ("Nguyễn Thị Thu Trang",),
            ("Nguyễn Thị Ngọc Ánh",),
            ("Phạm Minh Hiếu",),
            ("Lương Văn Khiêm",),
            ("Nghiêm Thị Hoài Trang",),
            ("Nguyễn Thu Trang",),
            ("Võ Thị Thu Thảo",),
            ("Nguyễn Văn Kiểm",),
            ("Đoàn Thị Ngọc Mai",),
            ("Phạm Thanh Trúc",),
            ("Triệu Thị Thúy",),
            ("Nguyễn Thị Thảo Uyên",),
            ("Lê Yến Nhung",),
            ("Huỳnh Thị Mỹ Hà",),
            ("Hoàng Lê Na",),
            ("Lê Thanh Tùng",),
            ("Đàm Trường Hải",),
            ("Hà Huy Nhật",),
            ("Bùi Đình Đức Lương",),
            ("Nguyễn Thị Hà",),
            ("Hoàng Quốc Huy",),
            ("Mã Quốc Cường",),
            ("Trần Thị Tường Vi",),
            ("Đỗ Thị Thương",),
        ]
    },
    {
        "name": "TOPIK 3, 4 SÁNG",
        "code": "S34",
        "desc": "Lớp TOPIK 3,4 ca Sáng",
        "level_from": 3,
        "level_to": 4,
        "student_prefix": "S",
        "admins": ["quanadmin"],
        "students": [
            ("Vũ Thị Mỹ Duyên",),
            ("Nguyễn Thị Ngọc Thảo",),
            ("Ngô Minh Thảo",),
            ("Nguyễn Thị Thúy",),
            ("Trần Thị Thảo Vân",),
            ("Nguyễn Ngọc Huyền",),
            ("Nguyễn Thùy Linh",),
            ("Nguyễn Thị Hà My",),
            ("Võ Thị Hường",),
            ("Nguyễn Phương Uyên",),
            ("Trần Thị Khánh Ly",),
            ("Kiều Hồng Nhung",),
            ("Nguyễn Hải Anh",),
            ("Bùi Ngọc Ánh",),
            ("Nguyễn Kiều Trang",),
            ("Phạm Thị Hằng",),
            ("Vũ Thị Hà",),
            ("Nguyễn Phương Thảo",),
            ("Đặng Quỳnh Anh",),
            ("Ngô Thị Hồng Ánh",),
            ("Lê Hải Đăng",),
            ("Bùi Thị Hiền",),
            ("Phạm Thị Mai Anh",),
            ("Nguyễn Hải Yến",),
            ("Tạ Thị Hồng Ngân",),
            ("Trịnh Thị Kiều Trang",),
            ("Phạm Thị Thu Ngân",),
            ("Trương Thị Huỳnh Như",),
            ("Vũ Thị Anh Trúc",),
        ]
    },
    {
        "name": "TOPIK 5, 6 ĐÊM",
        "code": "Q56",
        "desc": "Lớp TOPIK 5,6 ca Đêm",
        "level_from": 5,
        "level_to": 6,
        "student_prefix": "Q",
        "admins": ["quanadmin"],
        "students": [
            ("Nguyễn Thị Hồng Nhung",),
            ("Trịnh Thị Hồng Nhung",),
            ("Hoàng Hồng Nhung",),
            ("Trần Khánh Ninh",),
            ("Vũ Thị Ngoan",),
            ("Nguyễn Thị Sương",),
            ("Nguyễn Hiếu Tín",),
            ("Đỗ Tuấn Thanh",),
            ("Phạm Thị Lan Anh",),
            ("Bùi Thị Ngọc Anh",),
            ("Nguyễn Phương Anh",),
            ("Nguyễn Thị Thu Huyền",),
            ("Nguyễn Thu Hằng",),
            ("Hoàng Thị Linh",),
            ("Bùi Trọng Tuyển",),
            ("Mai Thế Duy",),
            ("Nguyễn Thị Mến",),
            ("Phạm Thị Hằng",),
            ("Lê Thị Mai Thảo",),
            ("Phạm Thu Huyền",),
            ("Nguyễn Thị Mỹ Ngân",),
            ("Nguyễn Thu Hà",),
            ("Bùi Thị Nghị",),
            ("Trần Thị Loan",),
            ("Đỗ Ánh Tuyết",),
            ("Doãn Thu Hoài",),
            ("Lê Phương Thảo",),
            ("Nguyễn Gia Linh",),
            ("Nguyễn Trần Phương Linh",),
            ("Lê Huỳnh Đức",),
            ("Trần Thị Mỹ Hạnh",),
            ("Trịnh Phương Thảo",),
            ("Đoàn Lê Diệu Linh",),
            ("Lường Tiến Đạt",),
        ]
    },
    {
        "name": "TOPIK 3, 4 CHIỀU",
        "code": "C34",
        "desc": "Lớp TOPIK 3,4 ca Chiều",
        "level_from": 3,
        "level_to": 4,
        "student_prefix": "C",
        "admins": ["kienadmin"],
        "students": [
            ("Nguyễn Thị Thanh",),
            ("Bùi Thu Hương",),
            ("Hoàng Thuỳ Dung",),
            ("Đặng Thị Diễm Quỳnh",),
            ("Đào Ngọc Huệ",),
            ("Khổng Thu Trang",),
            ("Võ Huỳnh Ca Thi",),
            ("Lê Thị Duyên",),
            ("Đào Thị Cúc",),
            ("Kiều Thị Thơm",),
            ("Phạm Thị Minh Giang",),
            ("Trịnh Thị Thu Hà",),
            ("Hoàng Thị Thu Trang",),
            ("Triệu Thị Như Kiều",),
            ("Nguyễn Thị Huyền",),
            ("Lý Phương Anh",),
            ("Lương Bảo Khanh",),
            ("Nguyễn Thị Vân Anh",),
            ("Nguyễn Thị Mai Loan",),
            ("Phạm Toan",),
            ("Lê Thị Phương Quyên",),
            ("Nguyễn Hoàng Hải",),
            ("Vũ Thị Huyền",),
            ("Nguyễn Loan Phượng",),
            ("Đặng Thị Yến",),
            ("Lương Thị Bích Ngọc",),
            ("Lê Thị Quỳnh Anh",),
            ("Trần Thị Thuỳ Dương",),
        ]
    },
]

def normalize_vietnamese(text):
    """Normalize Vietnamese diacritics to ASCII for usernames."""
    replacements = {
        'đ': 'd', 'Đ': 'D',
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }
    for vn, en in replacements.items():
        text = text.replace(vn, en)
    return text

def get_initials(full_name):
    """Extract initials from Vietnamese name: Nguyễn Thị Thu An → ntta"""
    words = full_name.strip().split()
    initials = "".join(w[0].lower() for w in words)
    return normalize_vietnamese(initials)

def gen_password(code):
    """Generate password: student_code + 123456@"""
    return f"{code}123456@"

random.seed(42)  # Reproducible

# Collect all students with their info
all_students = []  # (class_code, student_code, full_name, username, password, admin_usernames)

for cls in classes:
    for i, (name,) in enumerate(cls["students"]):
        num = i + 1
        student_code = f"{cls['student_prefix']}{num:02d}"
        initials = get_initials(name)
        username = f"{cls['student_prefix'].lower()}{num:02d}_{initials}"
        password = gen_password(student_code)
        all_students.append({
            "class_code": cls["code"],
            "class_name": cls["name"],
            "student_code": student_code,
            "full_name": name,
            "username": username,
            "password": password,
            "admins": cls["admins"],
        })

# ===== GENERATE CREDENTIALS .MD =====
md_lines = [
    "# 🔐 Hoa Nobita — Thông tin đăng nhập",
    "",
    f"> Ngày tạo: 2026-07-06 | Tổng số học viên: {len(all_students)}",
    "",
    "---",
    "",
    "## 👑 Quản trị viên",
    "",
    "| Username | Mật khẩu | Vai trò | Quản lý lớp |",
    "|---|---|---|---|",
    "| hoateacher | Password123! | TEACHER_OWNER | Tất cả |",
    "| kienadmin | Password123! | CLASS_ADMIN | D34, C34, LD |",
    "| quanadmin | Password123! | CLASS_ADMIN | S34, Q56, LD |",
    "",
    "> ⚠️ Mật khẩu admin nên được đổi sau lần đăng nhập đầu tiên.",
    "",
    "---",
    "",
]

for cls in classes:
    prefix = cls["student_prefix"]
    md_lines.append(f"## 📚 {cls['name']} (`{cls['code']}`)")
    md_lines.append(f"- Level: TOPIK {cls['level_from']}-{cls['level_to']}")
    md_lines.append(f"- Số học viên: {len(cls['students'])}")
    admin_names = ", ".join(cls["admins"])
    md_lines.append(f"- Admin: {admin_names}")
    md_lines.append("")
    md_lines.append("| Mã SV | Username | Mật khẩu | Họ và tên |")
    md_lines.append("|---|---|---|---|")
    
    for stud in [s for s in all_students if s["class_code"] == cls["code"]]:
        md_lines.append(f"| {stud['student_code']} | `{stud['username']}` | `{stud['password']}` | {stud['full_name']} |")
    
    md_lines.append("")

md_lines.extend([
    "---",
    "",
    "## 📋 Ghi chú",
    "",
    "1. **Mật khẩu** được generate ngẫu nhiên, liên kết với mã số học viên.",
    "2. **Username** format: `{mã_số_chữ_thường}_{chữ_cái_đầu_tên}` (vd: `c01_ntt`)",
    "3. Trang đăng nhập: https://hoanobita-frontend-77k3aivzoa-as.a.run.app",
    "4. Nếu quên mật khẩu, liên hệ admin lớp để reset.",
    "5. **Nên đổi mật khẩu** sau lần đăng nhập đầu tiên.",
    "",
    "---",
    "",
    f"*Tổng: {len(all_students)} học viên / {len(classes)} lớp*",
])

with open("/Users/wongun78/Vault/projects/hoa-nobita-system/CREDENTIALS.md", "w") as f:
    f.write("\n".join(md_lines))

print(f"✅ Generated CREDENTIALS.md with {len(all_students)} students across {len(classes)} classes")

# ===== GENERATE JAVA SEEDER =====
java_lines = []
java_lines.append('''package com.hoanobita.topikplatform.common;

import com.hoanobita.topikplatform.classroom.entity.ClassAdmin;
import com.hoanobita.topikplatform.classroom.entity.ClassMember;
import com.hoanobita.topikplatform.classroom.entity.Klass;
import com.hoanobita.topikplatform.classroom.repository.ClassAdminRepository;
import com.hoanobita.topikplatform.classroom.repository.ClassMemberRepository;
import com.hoanobita.topikplatform.classroom.repository.KlassRepository;
import com.hoanobita.topikplatform.common.Enums.*;
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

import java.time.Instant;
import java.util.*;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);
    private static final String DOMAIN = "hoanobita.edu.vn";
    private static final String ADMIN_DEFAULT_PASSWORD = "Password123!";

    private final EntityManager em;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final KlassRepository klassRepo;
    private final ClassMemberRepository classMemberRepo;
    private final ClassAdminRepository classAdminRepo;
    private final PasswordEncoder encoder;

    public DevDataSeeder(EntityManager em, UserRepository userRepo, RoleRepository roleRepo,
                         KlassRepository klassRepo, ClassMemberRepository classMemberRepo,
                         ClassAdminRepository classAdminRepo, PasswordEncoder encoder) {
        this.em = em;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.klassRepo = klassRepo;
        this.classMemberRepo = classMemberRepo;
        this.classAdminRepo = classAdminRepo;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("=== DevDataSeeder START (Real Data) ===");

        // Step 1: Delete all data in FK-safe order
        deleteAllData();

        // Step 2: Seed roles
        Role teacherRole = seedRole(RoleName.TEACHER_OWNER);
        Role adminRole = seedRole(RoleName.CLASS_ADMIN);
        Role studentRole = seedRole(RoleName.STUDENT);

        // Step 3: Seed admin users
        User teacher = seedUser("Nguyễn Tuấn Hoà", "hoateacher", "0900000000", ADMIN_DEFAULT_PASSWORD, teacherRole);
        User adminKien = seedUser("Nguyễn Kiên", "kienadmin", "0900000001", ADMIN_DEFAULT_PASSWORD, adminRole);
        User adminQuan = seedUser("Nguyễn Quân", "quanadmin", "0900000002", ADMIN_DEFAULT_PASSWORD, adminRole);

        // Step 4: Seed real classes and students
''')

# Generate class data
class_names_java = []
for cls in classes:
    var_name = cls["code"].lower().replace("34", "").replace("56", "") + "Class"
    if var_name.startswith("q"):
        var_name = "qClass"
    elif var_name.startswith("d"):
        var_name = "demClass"
    elif var_name.startswith("s"):
        var_name = "sangClass"
    elif var_name.startswith("c"):
        var_name = "chieuClass"
    elif var_name.startswith("l"):
        var_name = "ldClass"
    class_names_java.append(var_name)
    
    java_lines.append(f'        // --- {cls["name"]} ({cls["code"]}) ---')
    java_lines.append(f'        List<User> {var_name}Students = new ArrayList<>();')
    
    for i, (name,) in enumerate(cls["students"]):
        num = i + 1
        sc = f"{cls['student_prefix']}{num:02d}"
        initials = get_initials(name)
        uname = f"{cls['student_prefix'].lower()}{num:02d}_{initials}"
        pwd = gen_password(sc)
        name_escaped = name.replace("\\", "\\\\").replace('"', '\\"')
        java_lines.append(f'        {var_name}Students.add(seedStudent("{name_escaped}", "{uname}", "{pwd}", studentRole));')
    
    java_lines.append(f'        log.info("  → {{}} {cls["name"]} students seeded", {var_name}Students.size());')
    java_lines.append("")

# Generate class creation
java_lines.append("        // Step 5: Create classes")
for cls in classes:
    var_name = cls["code"].lower().replace("34", "").replace("56", "") + "Class"
    if var_name.startswith("q"):
        var_name = "qClass"
    elif var_name.startswith("d"):
        var_name = "demClass"
    elif var_name.startswith("s"):
        var_name = "sangClass"
    elif var_name.startswith("c"):
        var_name = "chieuClass"
    elif var_name.startswith("l"):
        var_name = "ldClass"
    
    name_escaped = cls["name"].replace("\\", "\\\\").replace('"', '\\"')
    desc_escaped = cls["desc"].replace("\\", "\\\\").replace('"', '\\"')
    java_lines.append(f'        Klass {var_name} = seedClass("{name_escaped}", "{cls["code"]}", "{desc_escaped}",')
    java_lines.append(f'                teacher.getId(), {cls["level_from"]}, {cls["level_to"]});')

java_lines.append("")

# Generate class members
java_lines.append("        // Step 6: Seed class members")
for cls in classes:
    var_name = cls["code"].lower().replace("34", "").replace("56", "") + "Class"
    if var_name.startswith("q"):
        var_name = "qClass"
    elif var_name.startswith("d"):
        var_name = "demClass"
    elif var_name.startswith("s"):
        var_name = "sangClass"
    elif var_name.startswith("c"):
        var_name = "chieuClass"
    elif var_name.startswith("l"):
        var_name = "ldClass"
    
    prefix = cls["student_prefix"]
    java_lines.append(f'        seedClassMembers({var_name}, {var_name}Students, "{prefix}");')

java_lines.append("")

# Generate admin assignments
java_lines.append("        // Step 7: Assign admins to classes")
admin_map = {
    "kienadmin": [],
    "quanadmin": [],
}
for cls in classes:
    var_name = cls["code"].lower().replace("34", "").replace("56", "") + "Class"
    if var_name.startswith("q"):
        var_name = "qClass"
    elif var_name.startswith("d"):
        var_name = "demClass"
    elif var_name.startswith("s"):
        var_name = "sangClass"
    elif var_name.startswith("c"):
        var_name = "chieuClass"
    elif var_name.startswith("l"):
        var_name = "ldClass"
    
    for admin in cls["admins"]:
        admin_map[admin].append(var_name)

for admin, class_vars in admin_map.items():
    for cv in class_vars:
        java_lines.append(f'        seedClassAdmin({cv}, admin{admin.replace("admin", "").capitalize()});')

java_lines.append("")

# Summary
total_students = sum(len(cls["students"]) for cls in classes)
java_lines.append(f'''        log.info("=== DevDataSeeder DONE ===");
        log.info("Summary:");
        log.info("  Users: 1 teacher + 2 admins + {total_students} students = {total_students + 3} total");
        log.info("  Classes: {len(classes)}");
        log.info("  Login: hoateacher / Password123!");
        log.info("  Login: kienadmin / Password123!");
        log.info("  Login: quanadmin / Password123!");
        log.info("  Student logins: see CREDENTIALS.md");
    }}

    private void deleteAllData() {{
        log.info("Deleting all existing data...");
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
    }}

    private Role seedRole(RoleName name) {{
        return roleRepo.findByName(name).orElseGet(() -> {{
            Role r = new Role();
            r.setName(name);
            return roleRepo.save(r);
        }});
    }}

    private User seedUser(String fullName, String username, String phone, String password, Role role) {{
        String email = username.toLowerCase() + "@" + DOMAIN;
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(encoder.encode(password));
        u.setStatus(UserStatus.ACTIVE);
        u.setFirstLogin(false);
        u.setRoles(Set.of(role));
        return userRepo.save(u);
    }}

    private User seedStudent(String fullName, String username, String password, Role role) {{
        String email = username.toLowerCase() + "@" + DOMAIN;
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setStatus(UserStatus.ACTIVE);
        u.setFirstLogin(false);
        u.setRoles(Set.of(role));
        return userRepo.save(u);
    }}

    private Klass seedClass(String name, String code, String desc, UUID teacherId,
                            int levelFrom, int levelTo) {{
        Klass k = new Klass();
        k.setName(name);
        k.setCode(code);
        k.setDescription(desc);
        k.setTeacherId(teacherId);
        k.setLevelFrom(levelFrom);
        k.setLevelTo(levelTo);
        k.setStatus(ClassStatus.ACTIVE);
        return klassRepo.save(k);
    }}

    private void seedClassMembers(Klass klass, List<User> students, String prefix) {{
        for (int i = 0; i < students.size(); i++) {{
            String code = String.format("%s%02d", prefix, i + 1);
            ClassMember cm = new ClassMember();
            cm.setClassId(klass.getId());
            cm.setStudentId(students.get(i).getId());
            cm.setStudentCode(code);
            cm.setStatus(MemberStatus.ACTIVE);
            cm.setJoinedAt(Instant.now());
            classMemberRepo.save(cm);
        }}
    }}

    private void seedClassAdmin(Klass klass, User admin) {{
        ClassAdmin ca = new ClassAdmin(klass.getId(), admin.getId());
        classAdminRepo.save(ca);
    }}
}}''')

with open("/Users/wongun78/Vault/projects/hoa-nobita-system/backend/src/main/java/com/hoanobita/topikplatform/common/DevDataSeeder.java", "w") as f:
    f.write("\n".join(java_lines))

print(f"✅ Generated DevDataSeeder.java")
print(f"   Total: {total_students} students in {len(classes)} classes")
print(f"   Total users: {total_students + 3} (including 3 admins)")
