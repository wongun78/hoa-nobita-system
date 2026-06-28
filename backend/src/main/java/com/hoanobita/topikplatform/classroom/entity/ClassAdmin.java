package com.hoanobita.topikplatform.classroom.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "class_admins")
@IdClass(ClassAdminId.class)
public class ClassAdmin {

    @Id
    @Column(name = "class_id")
    private UUID classId;

    @Id
    @Column(name = "admin_id")
    private UUID adminId;

    public ClassAdmin() {}

    public ClassAdmin(UUID classId, UUID adminId) {
        this.classId = classId;
        this.adminId = adminId;
    }

    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }

    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }
}
