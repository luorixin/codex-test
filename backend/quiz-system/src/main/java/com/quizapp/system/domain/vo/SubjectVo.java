package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubjectVo {
  private Long id;
  private String name;
  private Integer sortOrder;
}
