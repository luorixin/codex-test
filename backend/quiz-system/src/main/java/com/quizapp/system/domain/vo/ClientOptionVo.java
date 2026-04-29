package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ClientOptionVo {
  private Long id;
  private Long questionId;
  private String key;
  private String content;
}
