package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.vo.TopicProgressSnapshotVo;
import com.quizapp.system.service.IStudyStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicProgressController {

  private final IStudyStatsService studyStatsService;

  public TopicProgressController(IStudyStatsService studyStatsService) {
    this.studyStatsService = studyStatsService;
  }

  @GetMapping("/{topicId}/progress")
  public ApiResponse<TopicProgressSnapshotVo> getTopicProgress(@PathVariable("topicId") Long topicId) {
    return ApiResponse.ok(studyStatsService.getTopicProgressSnapshot(topicId));
  }
}
