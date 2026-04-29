package com.quizapp.system.domain.vo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnswerVo {
  private String questionId;
  private String sessionId;
  private boolean isCorrect;
  private List<String> correctOptionKeys;
  private List<String> selectedOptionKeys;
  private String answeredAt;
}
