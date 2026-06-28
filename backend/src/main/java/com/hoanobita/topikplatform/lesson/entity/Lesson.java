package com.hoanobita.topikplatform.lesson.entity;

import com.hoanobita.topikplatform.common.BaseEntity;
import com.hoanobita.topikplatform.common.Enums.LessonStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "lessons")
public class Lesson extends BaseEntity {

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "lesson_date")
    private LocalDate lessonDate;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LessonStatus status = LessonStatus.DRAFT;

    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getLessonDate() { return lessonDate; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public LessonStatus getStatus() { return status; }
    public void setStatus(LessonStatus status) { this.status = status; }
}
