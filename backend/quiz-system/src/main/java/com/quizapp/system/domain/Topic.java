package com.quizapp.system.domain;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Topic {
  private Long id;
  private Long subjectId;
  private Long parentId;
  private String name;
  private Integer sortOrder;
  private LocalDateTime createTime;
  private LocalDateTime updateTime;
}
