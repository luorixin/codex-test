package com.quizapp.system.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionOption {
  private Long id;
  private Long questionId;
  private String optionKey;
  private String content;
  private Integer isCorrect;
  private Integer sortOrder;
}
