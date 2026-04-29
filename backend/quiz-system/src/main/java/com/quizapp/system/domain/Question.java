package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Question {
  private Long id;
  private Long subjectId;
  private Long topicId;
  private String type;
  private String stem;
  private String explanation;
  private Integer difficulty;
  private String source;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
