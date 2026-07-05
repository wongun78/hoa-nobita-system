package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.classroom.dto.AddMemberRequest;
import com.hoanobita.topikplatform.classroom.dto.CreateClassRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ClassroomControllerIT extends IntegrationTestBase {

    @BeforeEach
    void setup() {
        setUp();
    }

    // --- List classes ---

    @Test
    void listClasses_asTeacher_returnsClasses() throws Exception {
        mockMvc.perform(get("/api/v1/classes")
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    void listClasses_asStudent_returnsEnrolledClasses() throws Exception {
        mockMvc.perform(get("/api/v1/classes")
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    // --- Create class ---

    @Test
    void createClass_asTeacher_succeeds() throws Exception {
        var req = new CreateClassRequest("New Class", "NC-001", "desc", null, null, null, null, null);

        mockMvc.perform(post("/api/v1/classes")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("New Class"))
                .andExpect(jsonPath("$.data.code").value("NC-001"));
    }

    @Test
    void createClass_asStudent_returns403() throws Exception {
        var req = new CreateClassRequest("Blocked", "BL-001", null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/classes")
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createClass_withMissingName_returns400() throws Exception {
        var req = new CreateClassRequest("", "CODE", null, null, null, null, null, null);

        mockMvc.perform(post("/api/v1/classes")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- Get class ---

    @Test
    void getClass_asStudent_returnsClass() throws Exception {
        mockMvc.perform(get("/api/v1/classes/{classId}", testClass.getId())
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test Class"));
    }

    @Test
    void getClass_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/classes/{classId}", UUID.randomUUID())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isNotFound());
    }

    // --- Update class ---

    @Test
    void updateClass_asTeacher_succeeds() throws Exception {
        String body = """
                {"name": "Updated Class Name"}
                """;

        mockMvc.perform(patch("/api/v1/classes/{classId}", testClass.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Class Name"));
    }

    // --- Delete class ---

    @Test
    void deleteClass_asTeacher_succeeds() throws Exception {
        mockMvc.perform(delete("/api/v1/classes/{classId}", testClass.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk());
    }

    // --- Add student ---

    @Test
    void addStudent_asTeacher_succeeds() throws Exception {
        // Create a new student not yet in class
        var newUser = createAnotherStudent();

        var req = new AddMemberRequest(null, newUser.getId(), null);

        mockMvc.perform(post("/api/v1/classes/{classId}/students", testClass.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    // --- List students ---

    @Test
    void listStudents_asTeacher_returnsMembers() throws Exception {
        mockMvc.perform(get("/api/v1/classes/{classId}/students", testClass.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray());
    }

    // --- Remove student ---

    @Test
    void removeStudent_asTeacher_succeeds() throws Exception {
        var newUser = createAnotherStudent();
        var req = new AddMemberRequest(null, newUser.getId(), null);

        // Add then remove
        mockMvc.perform(post("/api/v1/classes/{classId}/students", testClass.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/classes/{classId}/students/{studentId}",
                        testClass.getId(), newUser.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk());
    }

    private com.hoanobita.topikplatform.user.entity.User createAnotherStudent() {
        var studentRole = roleRepository.findByName(com.hoanobita.topikplatform.common.Enums.RoleName.STUDENT).orElseThrow();
        return createUser("Another Student", "another@test.com", "0999999999", studentRole);
    }
}
