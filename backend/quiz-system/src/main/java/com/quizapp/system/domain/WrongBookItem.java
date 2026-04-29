package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WrongBookItem {
  private Long id;
  private Long userId;
  private Long questionId;
  private Long subjectId;
  private Long topicId;
  private LocalDateTime firstWrongAt;
  private LocalDateTime lastWrongAt;
  private Integer wrongCount;
  private String lastSessionId;
  private Integer resolved;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
