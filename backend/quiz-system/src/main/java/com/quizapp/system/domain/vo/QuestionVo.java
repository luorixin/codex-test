package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class QuestionVo {
  private Long id;
  private Long subjectId;
  private Long topicId;
  private String type;
  private String stem;
  private String explanation;
  private Integer difficulty;
  private String source;
}
