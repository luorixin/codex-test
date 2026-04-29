package com.quizapp.system.domain.vo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WrongBookQuestionDetailVo {
  private String questionId;
  private String stem;
  private String explanation;
  private String type;
  private String subjectId;
  private String subjectName;
  private String topicId;
  private String topicName;
  private int wrongCount;
  private String firstWrongAt;
  private String lastWrongAt;
  private boolean resolved;
  private List<PracticeQuestionOptionVo> options;
  private List<PracticeAnswerRecordVo> recentAnswers;
}
