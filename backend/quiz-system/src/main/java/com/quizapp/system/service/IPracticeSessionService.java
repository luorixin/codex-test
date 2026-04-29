package com.quizapp.system.service;

import com.quizapp.system.domain.dto.CreatePracticeSessionBody;
import com.quizapp.system.domain.dto.SubmitPracticeAnswerBody;
import com.quizapp.system.domain.vo.CreatePracticeSessionVo;
import com.quizapp.system.domain.vo.PracticeSessionStateVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubmitPracticeAnswerVo;

public interface IPracticeSessionService {
  CreatePracticeSessionVo createSession(CreatePracticeSessionBody body);

  PracticeSessionStateVo getSessionState(String sessionId);

  SubmitPracticeAnswerVo submitAnswer(String sessionId, SubmitPracticeAnswerBody body);

  PracticeSessionSummaryVo getLatestSessionSummary();
}
