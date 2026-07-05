package com.hoanobita.topikplatform.assignment.entity;

import com.hoanobita.topikplatform.common.BaseEntity;
import com.hoanobita.topikplatform.common.Enums.AssignmentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignments")
public class Assignment extends BaseEntity {

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "lesson_id")
    private UUID lessonId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(columnDefinition = "text")
    private String instruction;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "max_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxScore = BigDecimal.TEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status = AssignmentStatus.DRAFT;

    @Column(name = "allow_resubmit", nullable = false)
    private boolean allowResubmit = false;

    @Column(columnDefinition = "text")
    private String skill;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "file_ids", columnDefinition = "text")
    private String fileIds;

    @Column(name = "external_link", columnDefinition = "text")
    private String externalLink;

    // Getters and setters
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getInstruction() { return instruction; }
    public void setInstruction(String instruction) { this.instruction = instruction; }
    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }
    public boolean isAllowResubmit() { return allowResubmit; }
    public void setAllowResubmit(boolean allowResubmit) { this.allowResubmit = allowResubmit; }
    public String getSkill() { return skill; }
    public void setSkill(String skill) { this.skill = skill; }
    public UUID getFileId() { return fileId; }
    public void setFileId(UUID fileId) { this.fileId = fileId; }
    public String getFileIds() { return fileIds; }
    public void setFileIds(String fileIds) { this.fileIds = fileIds; }
    public String getExternalLink() { return externalLink; }
    public void setExternalLink(String externalLink) { this.externalLink = externalLink; }
}
