package com.hoanobita.topikplatform.classroom.entity;

import com.hoanobita.topikplatform.common.BaseEntity;
import com.hoanobita.topikplatform.common.Enums.ClassStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "classes")
public class Klass extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "level_from")
    private Integer levelFrom;

    @Column(name = "level_to")
    private Integer levelTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassStatus status = ClassStatus.ACTIVE;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getLevelFrom() { return levelFrom; }
    public void setLevelFrom(Integer levelFrom) { this.levelFrom = levelFrom; }

    public Integer getLevelTo() { return levelTo; }
    public void setLevelTo(Integer levelTo) { this.levelTo = levelTo; }

    public ClassStatus getStatus() { return status; }
    public void setStatus(ClassStatus status) { this.status = status; }

    public UUID getTeacherId() { return teacherId; }
    public void setTeacherId(UUID teacherId) { this.teacherId = teacherId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
}
