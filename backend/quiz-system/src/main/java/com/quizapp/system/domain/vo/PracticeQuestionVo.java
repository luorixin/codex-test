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
public class PracticeQuestionVo {
  private String id;
  private String topicId;
  private String topicName;
  private String type;
  private String stem;
  private String explanation;
  private List<PracticeQuestionOptionVo> options;
}
