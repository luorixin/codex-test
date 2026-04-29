package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.vo.WrongBookOverviewVo;
import com.quizapp.system.domain.vo.WrongBookQuestionDetailVo;
import com.quizapp.system.domain.vo.WrongBookQuestionSummaryVo;
import com.quizapp.system.domain.vo.WrongBookSubjectSummaryVo;
import com.quizapp.system.domain.vo.WrongBookTopicSummaryVo;
import com.quizapp.system.service.IWrongBookService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wrong-book")
public class WrongBookController {

  private final IWrongBookService wrongBookService;

  public WrongBookController(IWrongBookService wrongBookService) {
    this.wrongBookService = wrongBookService;
  }

  @GetMapping("/overview")
  public ApiResponse<WrongBookOverviewVo> getOverview(
      @RequestParam(value = "subjectId", required = false) Long subjectId
  ) {
    return ApiResponse.ok(wrongBookService.getOverview(subjectId));
  }

  @GetMapping("/subjects")
  public ApiResponse<List<WrongBookSubjectSummaryVo>> listSubjects() {
    return ApiResponse.ok(wrongBookService.listSubjects());
  }

  @GetMapping("/topics")
  public ApiResponse<List<WrongBookTopicSummaryVo>> listTopics(@RequestParam("subjectId") Long subjectId) {
    return ApiResponse.ok(wrongBookService.listTopics(subjectId));
  }

  @GetMapping("/questions")
  public ApiResponse<List<WrongBookQuestionSummaryVo>> listQuestions(
      @RequestParam("subjectId") Long subjectId,
      @RequestParam(value = "topicId", required = false) Long topicId,
      @RequestParam(value = "includeResolved", defaultValue = "false") boolean includeResolved
  ) {
    return ApiResponse.ok(wrongBookService.listQuestions(subjectId, topicId, includeResolved));
  }

  @GetMapping("/questions/{questionId}")
  public ApiResponse<WrongBookQuestionDetailVo> getQuestionDetail(@PathVariable("questionId") Long questionId) {
    return ApiResponse.ok(wrongBookService.getQuestionDetail(questionId));
  }
}
