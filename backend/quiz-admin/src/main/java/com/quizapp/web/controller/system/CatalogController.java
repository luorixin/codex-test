package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.vo.CatalogSnapshotVo;
import com.quizapp.system.service.IQuestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {

  private final IQuestionService questionService;

  public CatalogController(IQuestionService questionService) {
    this.questionService = questionService;
  }

  @GetMapping("/snapshot")
  public ApiResponse<CatalogSnapshotVo> getSnapshot() {
    return ApiResponse.ok(questionService.getSnapshot());
  }
}
