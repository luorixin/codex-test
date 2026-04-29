package com.quizapp.system.domain.vo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CatalogSnapshotVo {
  private List<SubjectVo> subjects;
  private List<TopicVo> topics;
  private List<QuestionVo> questions;
  private List<ClientOptionVo> options;
}
