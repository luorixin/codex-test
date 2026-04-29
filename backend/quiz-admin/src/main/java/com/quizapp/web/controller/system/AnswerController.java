package com.quizapp.web.controller.system;

import com.quizapp.core.domain.ApiResponse;
import com.quizapp.system.domain.dto.AnswerBody;
import com.quizapp.system.domain.vo.AnswerVo;
import com.quizapp.system.service.IQuestionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/answers")
public class AnswerController {

  private final IQuestionService questionService;

  public AnswerController(IQuestionService questionService) {
    this.questionService = questionService;
  }

  @PostMapping
  public ApiResponse<AnswerVo> submitAnswer(@Valid @RequestBody AnswerBody body) {
    return ApiResponse.ok(questionService.evaluate(body));
  }
}
