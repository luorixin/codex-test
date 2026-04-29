package com.quizapp.system.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerBody {
  @NotBlank
  private String questionId;

  private String sessionId;

  @NotEmpty
  private List<String> selectedOptionKeys;
}
