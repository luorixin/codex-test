package com.quizapp.system.domain.vo;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
  @JsonIgnore
  private String correctOptionKeysPayload;
  private List<String> correctOptionKeys;
  private List<PracticeQuestionOptionVo> options;
  private List<PracticeAnswerRecordVo> recentAnswers;
}
