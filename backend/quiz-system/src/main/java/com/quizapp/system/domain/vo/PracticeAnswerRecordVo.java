package com.quizapp.system.domain.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PracticeAnswerRecordVo {
  private String id;
  private String sessionId;
  private String questionId;
  private List<String> selectedOptionKeys;
  @JsonProperty("isCorrect")
  private boolean isCorrect;
  private String answeredAt;
}
