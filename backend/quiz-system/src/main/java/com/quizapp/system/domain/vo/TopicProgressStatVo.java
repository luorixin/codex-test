package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TopicProgressStatVo {
  private String topicId;
  private String topicName;
  private String subjectId;
  private String subjectName;
  private int totalQuestions;
  private int answeredQuestions;
  private int answerCount;
  private int correctCount;
  private int completionRate;
  private int accuracyRate;
}
