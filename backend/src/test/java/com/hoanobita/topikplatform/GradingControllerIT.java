package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.grading.dto.GradeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GradingControllerIT extends IntegrationTestBase {

    private com.hoanobita.topikplatform.assignment.entity.Assignment assignment;
    private com.hoanobita.topikplatform.submission.entity.Submission submission;

    @BeforeEach
    void setup() {
        setUp();
        assignment = createAssignment(testClass.getId(), "Grading Assignment");
        submission = createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);
    }

    // --- Grade submission ---

    @Test
    void grade_asTeacher_createsGrade() throws Exception {
        var req = new GradeRequest(new BigDecimal("8.5"), "Good work", null, null);

        mockMvc.perform(post("/api/v1/submissions/{submissionId}/grade", submission.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(8.5))
                .andExpect(jsonPath("$.data.feedback").value("Good work"));
    }

    @Test
    void grade_asStudent_returns403() throws Exception {
        var req = new GradeRequest(new BigDecimal("8.5"), "feedback", null, null);

        mockMvc.perform(post("/api/v1/submissions/{submissionId}/grade", submission.getId())
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void grade_nonExistentSubmission_returns404() throws Exception {
        var req = new GradeRequest(new BigDecimal("8.5"), "feedback", null, null);

        mockMvc.perform(post("/api/v1/submissions/{submissionId}/grade", UUID.randomUUID())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void grade_exceedingMaxScore_returns400() throws Exception {
        var req = new GradeRequest(new BigDecimal("999"), "too high", null, null);

        mockMvc.perform(post("/api/v1/submissions/{submissionId}/grade", submission.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- List class submissions ---

    @Test
    void classSubmissions_asTeacher_returnsSubmissions() throws Exception {
        mockMvc.perform(get("/api/v1/classes/{classId}/grading/submissions", testClass.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray());
    }

    // --- Request resubmit ---

    @Test
    void requestResubmit_asTeacher_transitionsStatus() throws Exception {
        mockMvc.perform(post("/api/v1/submissions/{submissionId}/request-resubmit", submission.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk());
    }

    @Test
    void requestResubmit_asStudent_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/submissions/{submissionId}/request-resubmit", submission.getId())
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isForbidden());
    }
}
