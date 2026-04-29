package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PracticeSessionQuestion {
  private Long id;
  private String sessionId;
  private Long questionId;
  private Integer positionIndex;
  private LocalDateTime createTime;
}
