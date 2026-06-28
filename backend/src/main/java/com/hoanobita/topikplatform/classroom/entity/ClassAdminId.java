package com.hoanobita.topikplatform.classroom.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ClassAdminId implements Serializable {
    private UUID classId;
    private UUID adminId;

    public ClassAdminId() {}
    public ClassAdminId(UUID classId, UUID adminId) {
        this.classId = classId;
        this.adminId = adminId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ClassAdminId that)) return false;
        return Objects.equals(classId, that.classId) && Objects.equals(adminId, that.adminId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(classId, adminId);
    }

    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }
}
