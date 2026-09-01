package com.hoanobita.topikplatform.common;

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

        // --- LỚP LUYỆN ĐỀ (LD) ---
        List<User> ldClassStudents = new ArrayList<>();
        ldClassStudents.add(seedStudent("Nguyễn Thị Thu An", "l01_ntta", "L01123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Văn Khánh", "l02_nvk", "L02123456@", studentRole));
        ldClassStudents.add(seedStudent("Đoàn Thanh Huyền", "l03_dth", "L03123456@", studentRole));
        ldClassStudents.add(seedStudent("Lương Thị Yến Nhi", "l04_ltyn", "L04123456@", studentRole));
        ldClassStudents.add(seedStudent("Trần Thị Hạnh", "l05_tth", "L05123456@", studentRole));
        ldClassStudents.add(seedStudent("Âu Ngọc Minh Châu", "l06_anmc", "L06123456@", studentRole));
        ldClassStudents.add(seedStudent("Lê Trường Sinh", "l07_lts", "L07123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Thị Hiếu Ngân", "l08_nthn", "L08123456@", studentRole));
        ldClassStudents.add(seedStudent("Phùng Thuỳ Dung", "l09_ptd", "L09123456@", studentRole));
        ldClassStudents.add(seedStudent("Dương Thuỳ Linh", "l10_dtl", "L10123456@", studentRole));
        ldClassStudents.add(seedStudent("Dương Thu Huyền", "l11_dth", "L11123456@", studentRole));
        ldClassStudents.add(seedStudent("Trần Thị Lan Anh", "l12_ttla", "L12123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Thị Hường", "l13_nth", "L13123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Ngọc Quyên", "l14_nnq", "L14123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Thị Kim Ánh", "l15_ntka", "L15123456@", studentRole));
        ldClassStudents.add(seedStudent("Cao Văn Trường", "l16_cvt", "L16123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Phương Khánh", "l17_npk", "L17123456@", studentRole));
        ldClassStudents.add(seedStudent("Lê Thị Phương Chi", "l18_ltpc", "L18123456@", studentRole));
        ldClassStudents.add(seedStudent("Tạ Thị Duật", "l19_ttd", "L19123456@", studentRole));
        ldClassStudents.add(seedStudent("Trần Hồng Hạnh", "l20_thh", "L20123456@", studentRole));
        ldClassStudents.add(seedStudent("Lê Lan Hương", "l21_llh", "L21123456@", studentRole));
        ldClassStudents.add(seedStudent("Phạm Thanh Hằng", "l22_pth", "L22123456@", studentRole));
        ldClassStudents.add(seedStudent("Dương Hoàng Vy", "l23_dhv", "L23123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Thị Hồng Thắm", "l24_ntht", "L24123456@", studentRole));
        ldClassStudents.add(seedStudent("Trần Ngọc Bảo Hoàng", "l25_tnbh", "L25123456@", studentRole));
        ldClassStudents.add(seedStudent("Phạm Thị Hồng Hạnh", "l26_pthh", "L26123456@", studentRole));
        ldClassStudents.add(seedStudent("Ngô Thanh Huyền", "l27_nth", "L27123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Duy Hoàng", "l28_ndh", "L28123456@", studentRole));
        ldClassStudents.add(seedStudent("Lê Thị Thu Hồng", "l29_ltth", "L29123456@", studentRole));
        ldClassStudents.add(seedStudent("Nguyễn Thị Quỳnh Anh", "l30_ntqa", "L30123456@", studentRole));
        log.info("  → {} LỚP LUYỆN ĐỀ students seeded", ldClassStudents.size());

        // --- TOPIK 3, 4 ĐÊM (D34) ---
        List<User> demClassStudents = new ArrayList<>();
        demClassStudents.add(seedStudent("Nguyễn Quang Huy", "d01_nqh", "D01123456@", studentRole));
        demClassStudents.add(seedStudent("Võ Thị Bảo Nhi", "d02_vtbn", "D02123456@", studentRole));
        demClassStudents.add(seedStudent("Chu Thị Lan Hương", "d03_ctlh", "D03123456@", studentRole));
        demClassStudents.add(seedStudent("Đặng Thị Nhi", "d04_dtn", "D04123456@", studentRole));
        demClassStudents.add(seedStudent("Trần Thanh Bình", "d05_ttb", "D05123456@", studentRole));
        demClassStudents.add(seedStudent("Phạm Thị Hồng Hạnh", "d06_pthh", "D06123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Việt Chinh", "d07_nvc", "D07123456@", studentRole));
        demClassStudents.add(seedStudent("Vũ Thị Ngọc Hậu", "d08_vtnh", "D08123456@", studentRole));
        demClassStudents.add(seedStudent("Phạm Quỳnh Mai", "d09_pqm", "D09123456@", studentRole));
        demClassStudents.add(seedStudent("Dương Thị Ngọc Anh", "d10_dtna", "D10123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Thị Thu Trang", "d11_nttt", "D11123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Thị Ngọc Ánh", "d12_ntna", "D12123456@", studentRole));
        demClassStudents.add(seedStudent("Phạm Minh Hiếu", "d13_pmh", "D13123456@", studentRole));
        demClassStudents.add(seedStudent("Lương Văn Khiêm", "d14_lvk", "D14123456@", studentRole));
        demClassStudents.add(seedStudent("Nghiêm Thị Hoài Trang", "d15_ntht", "D15123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Thu Trang", "d16_ntt", "D16123456@", studentRole));
        demClassStudents.add(seedStudent("Võ Thị Thu Thảo", "d17_vttt", "D17123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Văn Kiểm", "d18_nvk", "D18123456@", studentRole));
        demClassStudents.add(seedStudent("Đoàn Thị Ngọc Mai", "d19_dtnm", "D19123456@", studentRole));
        demClassStudents.add(seedStudent("Phạm Thanh Trúc", "d20_ptt", "D20123456@", studentRole));
        demClassStudents.add(seedStudent("Triệu Thị Thúy", "d21_ttt", "D21123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Thị Thảo Uyên", "d22_nttu", "D22123456@", studentRole));
        demClassStudents.add(seedStudent("Lê Yến Nhung", "d23_lyn", "D23123456@", studentRole));
        demClassStudents.add(seedStudent("Huỳnh Thị Mỹ Hà", "d24_htmh", "D24123456@", studentRole));
        demClassStudents.add(seedStudent("Hoàng Lê Na", "d25_hln", "D25123456@", studentRole));
        demClassStudents.add(seedStudent("Lê Thanh Tùng", "d26_ltt", "D26123456@", studentRole));
        demClassStudents.add(seedStudent("Đàm Trường Hải", "d27_dth", "D27123456@", studentRole));
        demClassStudents.add(seedStudent("Hà Huy Nhật", "d28_hhn", "D28123456@", studentRole));
        demClassStudents.add(seedStudent("Bùi Đình Đức Lương", "d29_bddl", "D29123456@", studentRole));
        demClassStudents.add(seedStudent("Nguyễn Thị Hà", "d30_nth", "D30123456@", studentRole));
        demClassStudents.add(seedStudent("Hoàng Quốc Huy", "d31_hqh", "D31123456@", studentRole));
        demClassStudents.add(seedStudent("Mã Quốc Cường", "d32_mqc", "D32123456@", studentRole));
        demClassStudents.add(seedStudent("Trần Thị Tường Vi", "d33_tttv", "D33123456@", studentRole));
        demClassStudents.add(seedStudent("Đỗ Thị Thương", "d34_dtt", "D34123456@", studentRole));
        log.info("  → {} TOPIK 3, 4 ĐÊM students seeded", demClassStudents.size());

        // --- TOPIK 3, 4 SÁNG (S34) ---
        List<User> sangClassStudents = new ArrayList<>();
        sangClassStudents.add(seedStudent("Vũ Thị Mỹ Duyên", "s01_vtmd", "S01123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Thị Ngọc Thảo", "s02_ntnt", "S02123456@", studentRole));
        sangClassStudents.add(seedStudent("Ngô Minh Thảo", "s03_nmt", "S03123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Thị Thúy", "s04_ntt", "S04123456@", studentRole));
        sangClassStudents.add(seedStudent("Trần Thị Thảo Vân", "s05_tttv", "S05123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Ngọc Huyền", "s06_nnh", "S06123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Thùy Linh", "s07_ntl", "S07123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Thị Hà My", "s08_nthm", "S08123456@", studentRole));
        sangClassStudents.add(seedStudent("Võ Thị Hường", "s09_vth", "S09123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Phương Uyên", "s10_npu", "S10123456@", studentRole));
        sangClassStudents.add(seedStudent("Trần Thị Khánh Ly", "s11_ttkl", "S11123456@", studentRole));
        sangClassStudents.add(seedStudent("Kiều Hồng Nhung", "s12_khn", "S12123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Hải Anh", "s13_nha", "S13123456@", studentRole));
        sangClassStudents.add(seedStudent("Bùi Ngọc Ánh", "s14_bna", "S14123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Kiều Trang", "s15_nkt", "S15123456@", studentRole));
        sangClassStudents.add(seedStudent("Phạm Thị Hằng", "s16_pth", "S16123456@", studentRole));
        sangClassStudents.add(seedStudent("Vũ Thị Hà", "s17_vth", "S17123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Phương Thảo", "s18_npt", "S18123456@", studentRole));
        sangClassStudents.add(seedStudent("Đặng Quỳnh Anh", "s19_dqa", "S19123456@", studentRole));
        sangClassStudents.add(seedStudent("Ngô Thị Hồng Ánh", "s20_ntha", "S20123456@", studentRole));
        sangClassStudents.add(seedStudent("Lê Hải Đăng", "s21_lhd", "S21123456@", studentRole));
        sangClassStudents.add(seedStudent("Bùi Thị Hiền", "s22_bth", "S22123456@", studentRole));
        sangClassStudents.add(seedStudent("Phạm Thị Mai Anh", "s23_ptma", "S23123456@", studentRole));
        sangClassStudents.add(seedStudent("Nguyễn Hải Yến", "s24_nhy", "S24123456@", studentRole));
        sangClassStudents.add(seedStudent("Tạ Thị Hồng Ngân", "s25_tthn", "S25123456@", studentRole));
        sangClassStudents.add(seedStudent("Trịnh Thị Kiều Trang", "s26_ttkt", "S26123456@", studentRole));
        sangClassStudents.add(seedStudent("Phạm Thị Thu Ngân", "s27_pttn", "S27123456@", studentRole));
        sangClassStudents.add(seedStudent("Trương Thị Huỳnh Như", "s28_tthn", "S28123456@", studentRole));
        sangClassStudents.add(seedStudent("Vũ Thị Anh Trúc", "s29_vtat", "S29123456@", studentRole));
        log.info("  → {} TOPIK 3, 4 SÁNG students seeded", sangClassStudents.size());

        // --- TOPIK 5, 6 ĐÊM (Q56) ---
        List<User> qClassStudents = new ArrayList<>();
        qClassStudents.add(seedStudent("Nguyễn Thị Hồng Nhung", "q01_nthn", "Q01123456@", studentRole));
        qClassStudents.add(seedStudent("Trịnh Thị Hồng Nhung", "q02_tthn", "Q02123456@", studentRole));
        qClassStudents.add(seedStudent("Hoàng Hồng Nhung", "q03_hhn", "Q03123456@", studentRole));
        qClassStudents.add(seedStudent("Trần Khánh Ninh", "q04_tkn", "Q04123456@", studentRole));
        qClassStudents.add(seedStudent("Vũ Thị Ngoan", "q05_vtn", "Q05123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thị Sương", "q06_nts", "Q06123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Hiếu Tín", "q07_nht", "Q07123456@", studentRole));
        qClassStudents.add(seedStudent("Đỗ Tuấn Thanh", "q08_dtt", "Q08123456@", studentRole));
        qClassStudents.add(seedStudent("Phạm Thị Lan Anh", "q09_ptla", "Q09123456@", studentRole));
        qClassStudents.add(seedStudent("Bùi Thị Ngọc Anh", "q10_btna", "Q10123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Phương Anh", "q11_npa", "Q11123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thị Thu Huyền", "q12_ntth", "Q12123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thu Hằng", "q13_nth", "Q13123456@", studentRole));
        qClassStudents.add(seedStudent("Hoàng Thị Linh", "q14_htl", "Q14123456@", studentRole));
        qClassStudents.add(seedStudent("Bùi Trọng Tuyển", "q15_btt", "Q15123456@", studentRole));
        qClassStudents.add(seedStudent("Mai Thế Duy", "q16_mtd", "Q16123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thị Mến", "q17_ntm", "Q17123456@", studentRole));
        qClassStudents.add(seedStudent("Phạm Thị Hằng", "q18_pth", "Q18123456@", studentRole));
        qClassStudents.add(seedStudent("Lê Thị Mai Thảo", "q19_ltmt", "Q19123456@", studentRole));
        qClassStudents.add(seedStudent("Phạm Thu Huyền", "q20_pth", "Q20123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thị Mỹ Ngân", "q21_ntmn", "Q21123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Thu Hà", "q22_nth", "Q22123456@", studentRole));
        qClassStudents.add(seedStudent("Bùi Thị Nghị", "q23_btn", "Q23123456@", studentRole));
        qClassStudents.add(seedStudent("Trần Thị Loan", "q24_ttl", "Q24123456@", studentRole));
        qClassStudents.add(seedStudent("Đỗ Ánh Tuyết", "q25_dat", "Q25123456@", studentRole));
        qClassStudents.add(seedStudent("Doãn Thu Hoài", "q26_dth", "Q26123456@", studentRole));
        qClassStudents.add(seedStudent("Lê Phương Thảo", "q27_lpt", "Q27123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Gia Linh", "q28_ngl", "Q28123456@", studentRole));
        qClassStudents.add(seedStudent("Nguyễn Trần Phương Linh", "q29_ntpl", "Q29123456@", studentRole));
        qClassStudents.add(seedStudent("Lê Huỳnh Đức", "q30_lhd", "Q30123456@", studentRole));
        qClassStudents.add(seedStudent("Trần Thị Mỹ Hạnh", "q31_ttmh", "Q31123456@", studentRole));
        qClassStudents.add(seedStudent("Trịnh Phương Thảo", "q32_tpt", "Q32123456@", studentRole));
        qClassStudents.add(seedStudent("Đoàn Lê Diệu Linh", "q33_dldl", "Q33123456@", studentRole));
        qClassStudents.add(seedStudent("Lường Tiến Đạt", "q34_ltd", "Q34123456@", studentRole));
        log.info("  → {} TOPIK 5, 6 ĐÊM students seeded", qClassStudents.size());

        // --- TOPIK 3, 4 CHIỀU (C34) ---
        List<User> chieuClassStudents = new ArrayList<>();
        chieuClassStudents.add(seedStudent("Nguyễn Thị Thanh", "c01_ntt", "C01123456@", studentRole));
        chieuClassStudents.add(seedStudent("Bùi Thu Hương", "c02_bth", "C02123456@", studentRole));
        chieuClassStudents.add(seedStudent("Hoàng Thuỳ Dung", "c03_htd", "C03123456@", studentRole));
        chieuClassStudents.add(seedStudent("Đặng Thị Diễm Quỳnh", "c04_dtdq", "C04123456@", studentRole));
        chieuClassStudents.add(seedStudent("Đào Ngọc Huệ", "c05_dnh", "C05123456@", studentRole));
        chieuClassStudents.add(seedStudent("Khổng Thu Trang", "c06_ktt", "C06123456@", studentRole));
        chieuClassStudents.add(seedStudent("Võ Huỳnh Ca Thi", "c07_vhct", "C07123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lê Thị Duyên", "c08_ltd", "C08123456@", studentRole));
        chieuClassStudents.add(seedStudent("Đào Thị Cúc", "c09_dtc", "C09123456@", studentRole));
        chieuClassStudents.add(seedStudent("Kiều Thị Thơm", "c10_ktt", "C10123456@", studentRole));
        chieuClassStudents.add(seedStudent("Phạm Thị Minh Giang", "c11_ptmg", "C11123456@", studentRole));
        chieuClassStudents.add(seedStudent("Trịnh Thị Thu Hà", "c12_ttth", "C12123456@", studentRole));
        chieuClassStudents.add(seedStudent("Hoàng Thị Thu Trang", "c13_httt", "C13123456@", studentRole));
        chieuClassStudents.add(seedStudent("Triệu Thị Như Kiều", "c14_ttnk", "C14123456@", studentRole));
        chieuClassStudents.add(seedStudent("Nguyễn Thị Huyền", "c15_nth", "C15123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lý Phương Anh", "c16_lpa", "C16123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lương Bảo Khanh", "c17_lbk", "C17123456@", studentRole));
        chieuClassStudents.add(seedStudent("Nguyễn Thị Vân Anh", "c18_ntva", "C18123456@", studentRole));
        chieuClassStudents.add(seedStudent("Nguyễn Thị Mai Loan", "c19_ntml", "C19123456@", studentRole));
        chieuClassStudents.add(seedStudent("Phạm Toan", "c20_pt", "C20123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lê Thị Phương Quyên", "c21_ltpq", "C21123456@", studentRole));
        chieuClassStudents.add(seedStudent("Nguyễn Hoàng Hải", "c22_nhh", "C22123456@", studentRole));
        chieuClassStudents.add(seedStudent("Vũ Thị Huyền", "c23_vth", "C23123456@", studentRole));
        chieuClassStudents.add(seedStudent("Nguyễn Loan Phượng", "c24_nlp", "C24123456@", studentRole));
        chieuClassStudents.add(seedStudent("Đặng Thị Yến", "c25_dty", "C25123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lương Thị Bích Ngọc", "c26_ltbn", "C26123456@", studentRole));
        chieuClassStudents.add(seedStudent("Lê Thị Quỳnh Anh", "c27_ltqa", "C27123456@", studentRole));
        chieuClassStudents.add(seedStudent("Trần Thị Thuỳ Dương", "c28_tttd", "C28123456@", studentRole));
        log.info("  → {} TOPIK 3, 4 CHIỀU students seeded", chieuClassStudents.size());

        // Step 5: Create classes
        Klass ldClass = seedClass("LỚP LUYỆN ĐỀ", "LD", "Lớp Luyện Đề",
                teacher.getId(), 3, 6);
        Klass demClass = seedClass("TOPIK 3, 4 ĐÊM", "D34", "Lớp TOPIK 3,4 ca Đêm",
                teacher.getId(), 3, 4);
        Klass sangClass = seedClass("TOPIK 3, 4 SÁNG", "S34", "Lớp TOPIK 3,4 ca Sáng",
                teacher.getId(), 3, 4);
        Klass qClass = seedClass("TOPIK 5, 6 ĐÊM", "Q56", "Lớp TOPIK 5,6 ca Đêm",
                teacher.getId(), 5, 6);
        Klass chieuClass = seedClass("TOPIK 3, 4 CHIỀU", "C34", "Lớp TOPIK 3,4 ca Chiều",
                teacher.getId(), 3, 4);

        // Step 6: Seed class members
        seedClassMembers(ldClass, ldClassStudents, "L");
        seedClassMembers(demClass, demClassStudents, "D");
        seedClassMembers(sangClass, sangClassStudents, "S");
        seedClassMembers(qClass, qClassStudents, "Q");
        seedClassMembers(chieuClass, chieuClassStudents, "C");

        // Step 7: Assign admins to classes
        seedClassAdmin(ldClass, adminKien);
        seedClassAdmin(demClass, adminKien);
        seedClassAdmin(chieuClass, adminKien);
        seedClassAdmin(ldClass, adminQuan);
        seedClassAdmin(sangClass, adminQuan);
        seedClassAdmin(qClass, adminQuan);

        log.info("=== DevDataSeeder DONE ===");
        log.info("Summary:");
        log.info("  Users: 1 teacher + 2 admins + 155 students = 158 total");
        log.info("  Classes: 5");
        log.info("  Login: hoateacher / Password123!");
        log.info("  Login: kienadmin / Password123!");
        log.info("  Login: quanadmin / Password123!");
        log.info("  Student logins: see CREDENTIALS.md");
    }

    private void deleteAllData() {
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
    }

    private Role seedRole(RoleName name) {
        return roleRepo.findByName(name).orElseGet(() -> {
            Role r = new Role();
            r.setName(name);
            return roleRepo.save(r);
        });
    }

    private User seedUser(String fullName, String username, String phone, String password, Role role) {
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
    }

    private User seedStudent(String fullName, String username, String password, Role role) {
        String email = username.toLowerCase() + "@" + DOMAIN;
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(password));
        u.setStatus(UserStatus.ACTIVE);
        u.setFirstLogin(false);
        u.setRoles(Set.of(role));
        return userRepo.save(u);
    }

    private Klass seedClass(String name, String code, String desc, UUID teacherId,
                            int levelFrom, int levelTo) {
        Klass k = new Klass();
        k.setName(name);
        k.setCode(code);
        k.setDescription(desc);
        k.setTeacherId(teacherId);
        k.setLevelFrom(levelFrom);
        k.setLevelTo(levelTo);
        k.setStatus(ClassStatus.ACTIVE);
        return klassRepo.save(k);
    }

    private void seedClassMembers(Klass klass, List<User> students, String prefix) {
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
    }

    private void seedClassAdmin(Klass klass, User admin) {
        ClassAdmin ca = new ClassAdmin(klass.getId(), admin.getId());
        classAdminRepo.save(ca);
    }
}