package com.sinae.messenger;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinae.messenger.message.MessageRepository;
import com.sinae.messenger.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowTests {

    private static final String PASSWORD = "secure-pass-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @BeforeEach
    void clearTestRows() {
        messageRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void signupRejectsDuplicateAndInvalidInput() throws Exception {
        String username = newUsername();
        signup(username);

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("username", username, "password", PASSWORD)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"x\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginCreatesSessionAndRejectsWrongPassword() throws Exception {
        String username = newUsername();
        signup(username);

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("username", username, "password", PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("username", username, "password", "incorrect-pass")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void nicknameChangeUpdatesNicknameOnExistingMessages() throws Exception {
        MockHttpSession session = signupAndLogin(newUsername());
        String channelId = firstChannelId(session);
        changeNickname(session, "첫 닉네임");

        mockMvc.perform(post("/api/channels/{channelId}/messages", channelId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"안녕하세요\"}"))
                .andExpect(status().isOk());

        changeNickname(session, "바뀐 닉네임");
        mockMvc.perform(get("/api/channels/{channelId}/messages", channelId).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].authorNickname").value("바뀐 닉네임"));
    }

    @Test
    void messageValidationAndMissingChannelAreReported() throws Exception {
        MockHttpSession session = signupAndLogin(newUsername());
        String channelId = firstChannelId(session);
        changeNickname(session, "tester");

        mockMvc.perform(post("/api/channels/{channelId}/messages", channelId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"  \"}"))
                .andExpect(status().isBadRequest());

        String tooLong = "x".repeat(281);
        mockMvc.perform(post("/api/channels/{channelId}/messages", channelId)
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("content", tooLong)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/channels/{channelId}/messages", 999999).session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    void protectedChannelListRequiresLogin() throws Exception {
        mockMvc.perform(get("/api/channels"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutEndsTheAuthenticatedSession() throws Exception {
        MockHttpSession session = signupAndLogin(newUsername());
        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private void signup(String username) throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("username", username, "password", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    private MockHttpSession signupAndLogin(String username) throws Exception {
        signup(username);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("username", username, "password", PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private void changeNickname(MockHttpSession session, String nickname) throws Exception {
        mockMvc.perform(patch("/api/users/me/nickname")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("nickname", nickname)))
                .andExpect(status().isOk());
    }

    private String firstChannelId(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/channels").session(session))
                .andReturn();
        JsonNode channels = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        return channels.path(0).path("id").asText();
    }

    private String newUsername() {
        return "user" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String json(String firstKey, String firstValue, String secondKey, String secondValue) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of(firstKey, firstValue, secondKey, secondValue));
    }

    private String json(String key, String value) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of(key, value));
    }
}
