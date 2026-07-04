package com.hoanobita.topikplatform.submission.entity;

import com.hoanobita.topikplatform.common.BaseEntity;
import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions")
public class Submission extends BaseEntity {

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "content_text", columnDefinition = "text")
    private String contentText;

    @Column(name = "content_url", columnDefinition = "text")
    private String contentUrl;

    @Column(name = "file_id")
    private UUID fileId;

    @Column(name = "feedback_file_id")
    private UUID feedbackFileId;

    @Column(name = "feedback_link", columnDefinition = "text")
    private String feedbackLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt = Instant.now();

    // Getters and setters
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public String getContentText() { return contentText; }
    public void setContentText(String contentText) { this.contentText = contentText; }
    public String getContentUrl() { return contentUrl; }
    public void setContentUrl(String contentUrl) { this.contentUrl = contentUrl; }
    public UUID getFileId() { return fileId; }
    public void setFileId(UUID fileId) { this.fileId = fileId; }
    public UUID getFeedbackFileId() { return feedbackFileId; }
    public void setFeedbackFileId(UUID feedbackFileId) { this.feedbackFileId = feedbackFileId; }
    public String getFeedbackLink() { return feedbackLink; }
    public void setFeedbackLink(String feedbackLink) { this.feedbackLink = feedbackLink; }
    public SubmissionStatus getStatus() { return status; }
    public void setStatus(SubmissionStatus status) { this.status = status; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
