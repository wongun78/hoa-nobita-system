package com.hoanobita.topikplatform;

import com.hoanobita.topikplatform.auth.dto.ChangePasswordRequest;
import com.hoanobita.topikplatform.auth.dto.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIT extends IntegrationTestBase {

    @BeforeEach
    void setup() {
        setUp();
    }

    @Test
    void login_withValidCredentials_returnsToken() throws Exception {
        var req = new LoginRequest("teacher@test.com", "Password1");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value("teacher@test.com"));
    }

    @Test
    void login_withInvalidPassword_returns401() throws Exception {
        var req = new LoginRequest("teacher@test.com", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withNonExistentEmail_returns401() throws Exception {
        var req = new LoginRequest("nobody@test.com", "Password1");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withPhoneIdentifier_returnsToken() throws Exception {
        var req = new LoginRequest("0900000001", "Password1");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void me_withValidToken_returnsUserInfo() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Teacher User"))
                .andExpect(jsonPath("$.data.email").value("teacher@test.com"));
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_withValidCurrentPassword_succeeds() throws Exception {
        var req = new ChangePasswordRequest("Password1", "NewPassword1");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void changePassword_withWrongCurrentPassword_returns400() throws Exception {
        var req = new ChangePasswordRequest("WrongPassword", "NewPassword1");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePassword_withWeakNewPassword_returns400() throws Exception {
        var req = new ChangePasswordRequest("Password1", "weak");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", authHeader(teacher))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logout_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", authHeader(teacher)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("Logged out successfully"));
    }
}
