package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.vo.HomeOverviewVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.service.IStudyStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/home")
public class HomeController {

  private final IStudyStatsService studyStatsService;

  public HomeController(IStudyStatsService studyStatsService) {
    this.studyStatsService = studyStatsService;
  }

  @GetMapping("/overview")
  public ApiResponse<HomeOverviewVo> getOverview() {
    return ApiResponse.ok(studyStatsService.getHomeOverview());
  }

  @GetMapping("/recent-practice")
  public ApiResponse<PracticeSessionSummaryVo> getRecentPractice() {
    return ApiResponse.ok(studyStatsService.getRecentPractice());
  }
}
