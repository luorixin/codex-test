package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.vo.DailyPracticeStatVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubjectProgressStatVo;
import com.quizapp.system.domain.vo.TopicProgressStatVo;
import com.quizapp.system.service.IStudyStatsService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stats")
public class StudyStatsController {

  private final IStudyStatsService studyStatsService;

  public StudyStatsController(IStudyStatsService studyStatsService) {
    this.studyStatsService = studyStatsService;
  }

  @GetMapping("/daily")
  public ApiResponse<List<DailyPracticeStatVo>> getDailyStats(
      @RequestParam(value = "startDate", required = false) String startDate,
      @RequestParam(value = "endDate", required = false) String endDate
  ) {
    String resolvedEndDate = endDate != null ? endDate : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
    String resolvedStartDate = startDate != null
        ? startDate
        : LocalDate.parse(resolvedEndDate).minusDays(6).format(DateTimeFormatter.ISO_LOCAL_DATE);
    return ApiResponse.ok(studyStatsService.getDailyPracticeStats(resolvedStartDate, resolvedEndDate));
  }

  @GetMapping("/subjects")
  public ApiResponse<List<SubjectProgressStatVo>> getSubjectStats() {
    return ApiResponse.ok(studyStatsService.getSubjectProgressStats());
  }

  @GetMapping("/topics")
  public ApiResponse<List<TopicProgressStatVo>> getTopicStats() {
    return ApiResponse.ok(studyStatsService.getTopicProgressStats());
  }

  @GetMapping("/recent-practice")
  public ApiResponse<List<PracticeSessionSummaryVo>> getRecentPractice(
      @RequestParam(value = "limit", defaultValue = "5") int limit
  ) {
    return ApiResponse.ok(studyStatsService.getRecentPracticeSessions(limit));
  }
}
