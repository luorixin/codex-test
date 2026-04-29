package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PracticeSession {
  private String id;
  private Long userId;
  private String mode;
  private Long subjectId;
  private Long topicId;
  private String scopeTitle;
  private Integer questionCount;
  private Integer correctCount;
  private LocalDateTime startedAt;
  private LocalDateTime finishedAt;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
