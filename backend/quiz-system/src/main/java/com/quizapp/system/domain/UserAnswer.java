package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserAnswer {
  private String id;
  private String sessionId;
  private Long userId;
  private Long questionId;
  private String selectedOptionKeys;
  private Integer isCorrect;
  private LocalDateTime answeredAt;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
