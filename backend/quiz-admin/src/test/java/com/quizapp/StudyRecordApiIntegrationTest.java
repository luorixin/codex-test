package com.quizapp;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class StudyRecordApiIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private RedisConnectionFactory redisConnectionFactory;

  @MockBean
  private ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;

  @Test
  void practiceFlowPersistsToBackendTables() throws Exception {
    MvcResult createResult = mockMvc.perform(post("/api/v1/practice-sessions")
            .with(user("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "mode": "topic_practice",
                  "subjectId": 1,
                  "topicId": 1,
                  "scopeTitle": "代数基础"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.sessionId").isString())
        .andExpect(jsonPath("$.data.session.questionCount").value(2))
        .andReturn();

    String sessionId = JsonPathHelper.read(createResult.getResponse().getContentAsString(), "$.data.sessionId");

    mockMvc.perform(get("/api/v1/practice-sessions/{sessionId}", sessionId).with(user("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.session.id").value(sessionId))
        .andExpect(jsonPath("$.data.questions.length()").value(2))
        .andExpect(jsonPath("$.data.answers.length()").value(0));

    mockMvc.perform(post("/api/v1/practice-sessions/{sessionId}/answers", sessionId)
            .with(user("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "questionId": "1",
                  "selectedOptionKeys": ["A"]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.answer.sessionId").value(sessionId))
        .andExpect(jsonPath("$.data.answer.questionId").value("1"))
        .andExpect(jsonPath("$.data.answer.isCorrect").value(false))
        .andExpect(jsonPath("$.data.correctCount").value(0))
        .andExpect(jsonPath("$.data.answeredCount").value(1))
        .andExpect(jsonPath("$.data.correctOptionKeys[0]").value("B"));

    mockMvc.perform(get("/api/v1/wrong-book/overview").with(user("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.unresolvedCount").value(1))
        .andExpect(jsonPath("$.data.totalWrongCount").value(1));

    mockMvc.perform(get("/api/v1/wrong-book/questions/{questionId}", 1).with(user("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.questionId").value("1"))
        .andExpect(jsonPath("$.data.correctOptionKeys[0]").value("B"))
        .andExpect(jsonPath("$.data.correctOptionKeysPayload").doesNotExist());

    mockMvc.perform(get("/api/v1/home/overview").with(user("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalSessions").value(1))
        .andExpect(jsonPath("$.data.totalAnswers").value(1))
        .andExpect(jsonPath("$.data.unresolvedWrongCount").value(1));

    mockMvc.perform(get("/api/v1/stats/recent-practice").with(user("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(1))
        .andExpect(jsonPath("$.data[0].id").value(sessionId));
  }

  @Test
  void protectedStudyEndpointsRequireAuthentication() throws Exception {
    mockMvc.perform(get("/api/v1/home/overview"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("auth.errors.unauthorized"));
  }
}
