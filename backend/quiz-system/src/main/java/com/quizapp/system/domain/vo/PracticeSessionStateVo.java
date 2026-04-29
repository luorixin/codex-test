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
public class PracticeSessionStateVo {
  private PracticeSessionDetailVo session;
  private List<PracticeQuestionVo> questions;
  private List<PracticeAnswerRecordVo> answers;
}
