package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.common.Enums.SubmissionStatus;
import com.hoanobita.topikplatform.submission.dto.SubmissionRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SubmissionControllerIT extends IntegrationTestBase {

    private com.hoanobita.topikplatform.assignment.entity.Assignment assignment;

    @BeforeEach
    void setup() {
        setUp();
        assignment = createAssignment(testClass.getId(), "Test Assignment");
    }

    // --- Submit ---

    @Test
    void submit_asStudent_createsSubmission() throws Exception {
        var req = new SubmissionRequest("My answer", null, null, null);

        mockMvc.perform(post("/api/v1/assignments/{assignmentId}/submissions", assignment.getId())
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.contentText").value("My answer"))
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
    }

    // --- Get submission ---

    @Test
    void getSubmission_returnsSubmission() throws Exception {
        var sub = createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);

        mockMvc.perform(get("/api/v1/submissions/{submissionId}", sub.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contentText").value("Test submission"));
    }

    @Test
    void getSubmission_nonExistent_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/submissions/{submissionId}", UUID.randomUUID())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isNotFound());
    }

    // --- Update submission (resubmit) ---

    @Test
    void updateSubmission_studentUpdatesOwn_works() throws Exception {
        var sub = createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);
        var req = new SubmissionRequest("Updated answer", null, null, null);

        mockMvc.perform(patch("/api/v1/submissions/{submissionId}", sub.getId())
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contentText").value("Updated answer"));
    }

    // --- List by assignment ---

    @Test
    void listByAssignment_returnsSubmissions() throws Exception {
        createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);

        mockMvc.perform(get("/api/v1/assignments/{assignmentId}/submissions", assignment.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    // --- My submissions ---

    @Test
    void mySubmissions_returnsStudentSubmissions() throws Exception {
        createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);

        mockMvc.perform(get("/api/v1/me/submissions")
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    // --- Delete submission ---

    @Test
    void deleteSubmission_studentCanDeleteOwn() throws Exception {
        var sub = createSubmission(assignment.getId(), student.getId(), SubmissionStatus.SUBMITTED);

        mockMvc.perform(delete("/api/v1/submissions/{submissionId}", sub.getId())
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isOk());
    }

    // --- Status transitions ---

    @Test
    void submit_withResubmitRequested_transitionsToSubmitted() throws Exception {
        var sub = createSubmission(assignment.getId(), student.getId(), SubmissionStatus.RESUBMIT_REQUESTED);
        var req = new SubmissionRequest("Resubmitted answer", null, null, null);

        mockMvc.perform(patch("/api/v1/submissions/{submissionId}", sub.getId())
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
    }
}
