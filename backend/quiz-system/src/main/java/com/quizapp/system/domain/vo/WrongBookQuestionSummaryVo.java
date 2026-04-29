package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WrongBookQuestionSummaryVo {
  private String questionId;
  private String stem;
  private String subjectId;
  private String subjectName;
  private String topicId;
  private String topicName;
  private int wrongCount;
  private boolean resolved;
  private String lastWrongAt;
}
