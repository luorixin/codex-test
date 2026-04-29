package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TopicVo {
  private Long id;
  private Long subjectId;
  private Long parentId;
  private String name;
  private Integer sortOrder;
}
