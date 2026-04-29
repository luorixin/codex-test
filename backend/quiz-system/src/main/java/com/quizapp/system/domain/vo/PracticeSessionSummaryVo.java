package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeSessionSummaryVo {
  private String id;
  private String mode;
  private String topicId;
  private String scopeTitle;
  private String subjectName;
  private int questionCount;
  private int correctCount;
  private String startedAt;
  private String finishedAt;
}
