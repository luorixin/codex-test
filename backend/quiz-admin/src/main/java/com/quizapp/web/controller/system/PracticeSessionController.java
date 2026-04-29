package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.dto.CreatePracticeSessionBody;
import com.quizapp.system.domain.dto.SubmitPracticeAnswerBody;
import com.quizapp.system.domain.vo.CreatePracticeSessionVo;
import com.quizapp.system.domain.vo.PracticeSessionStateVo;
import com.quizapp.system.domain.vo.SubmitPracticeAnswerVo;
import com.quizapp.system.service.IPracticeSessionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/practice-sessions")
public class PracticeSessionController {

  private final IPracticeSessionService practiceSessionService;

  public PracticeSessionController(IPracticeSessionService practiceSessionService) {
    this.practiceSessionService = practiceSessionService;
  }

  @PostMapping
  public ApiResponse<CreatePracticeSessionVo> createSession(
      @Valid @RequestBody CreatePracticeSessionBody body
  ) {
    return ApiResponse.ok(practiceSessionService.createSession(body));
  }

  @GetMapping("/{sessionId}")
  public ApiResponse<PracticeSessionStateVo> getSessionState(@PathVariable("sessionId") String sessionId) {
    return ApiResponse.ok(practiceSessionService.getSessionState(sessionId));
  }

  @PostMapping("/{sessionId}/answers")
  public ApiResponse<SubmitPracticeAnswerVo> submitAnswer(
      @PathVariable("sessionId") String sessionId,
      @Valid @RequestBody SubmitPracticeAnswerBody body
  ) {
    return ApiResponse.ok(practiceSessionService.submitAnswer(sessionId, body));
  }
}
