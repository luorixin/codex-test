package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WrongBookOverviewVo {
  private int unresolvedCount;
  private int resolvedCount;
  private int totalWrongCount;
}
