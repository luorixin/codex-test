package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeSessionDetailVo {
  private String id;
  private String mode;
  private String subjectId;
  private String subjectName;
  private String topicId;
  private String scopeTitle;
  private String startedAt;
  private String finishedAt;
  private int questionCount;
  private int correctCount;
}
