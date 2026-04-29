package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WrongBookSubjectSummaryVo {
  private String subjectId;
  private String subjectName;
  private int unresolvedCount;
}
