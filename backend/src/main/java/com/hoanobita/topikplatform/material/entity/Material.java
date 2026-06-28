package com.hoanobita.topikplatform.material.entity;

import com.hoanobita.topikplatform.common.BaseEntity;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "materials")
public class Material extends BaseEntity {

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "lesson_id")
    private UUID lessonId;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "external_url", columnDefinition = "text")
    private String externalUrl;

    @Column(nullable = false)
    private boolean visible = true;

    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }
    public UUID getFileId() { return fileId; }
    public void setFileId(UUID fileId) { this.fileId = fileId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getExternalUrl() { return externalUrl; }
    public void setExternalUrl(String externalUrl) { this.externalUrl = externalUrl; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
}
