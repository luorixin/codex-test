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
public class SubmitPracticeAnswerVo {
  private PracticeAnswerRecordVo answer;
  private List<String> correctOptionKeys;
  @JsonProperty("isFinished")
  private boolean isFinished;
  private int correctCount;
  private int answeredCount;
}
