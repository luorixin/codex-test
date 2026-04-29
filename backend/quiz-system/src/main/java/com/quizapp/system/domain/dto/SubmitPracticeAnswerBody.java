package com.quizapp.system.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitPracticeAnswerBody {
  @NotBlank(message = "answer.errors.questionIdRequired")
  private String questionId;

  @NotEmpty(message = "answer.errors.emptySelection")
  private List<String> selectedOptionKeys;
}
