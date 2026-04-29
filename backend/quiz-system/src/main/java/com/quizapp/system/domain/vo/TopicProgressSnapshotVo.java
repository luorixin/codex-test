package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TopicProgressSnapshotVo {
  private int childTopicCount;
  private int questionCount;
  private int answeredCount;
  private int wrongCount;
}
