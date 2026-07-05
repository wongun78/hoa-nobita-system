package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.user.dto.CreateUserRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerIT extends IntegrationTestBase {

    @BeforeEach
    void setup() {
        setUp();
    }

    // --- List users ---

    @Test
    void listUsers_asTeacher_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.totalItems").value(3));
    }

    @Test
    void listUsers_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .header("Authorization", authHeader(student)))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsers_withSearchFiltersByName() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .param("search", "Teacher")
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].fullName").value("Teacher User"));
    }

    // --- Create user ---

    @Test
    void createUser_asTeacher_succeeds() throws Exception {
        var req = new CreateUserRequest("New Student", "new@test.com", "0911111111", "STUDENT", "note");

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.fullName").value("New Student"));
    }

    @Test
    void createUser_asStudent_returns403() throws Exception {
        var req = new CreateUserRequest("Blocked", "blocked@test.com", "0922222222", "STUDENT", null);

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", authHeader(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createUser_withMissingName_returns400() throws Exception {
        var req = new CreateUserRequest("", "bad@test.com", "0933333333", "STUDENT", null);

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // --- Get user by ID ---

    @Test
    void getUser_asTeacher_returnsUser() throws Exception {
        mockMvc.perform(get("/api/v1/users/{id}", student.getId())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Student User"));
    }

    @Test
    void getUser_nonExistentId_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/users/{id}", UUID.randomUUID())
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isNotFound());
    }

    // --- Update user ---

    @Test
    void updateUser_asTeacher_succeeds() throws Exception {
        String body = """
                {"fullName": "Updated Student", "note": "updated"}
                """;

        mockMvc.perform(patch("/api/v1/users/{id}", student.getId())
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Updated Student"));
    }
}
