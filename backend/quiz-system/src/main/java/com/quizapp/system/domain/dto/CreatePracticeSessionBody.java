package com.quizapp.system.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePracticeSessionBody {
  @NotBlank(message = "practice.errors.modeRequired")
  private String mode;

  @NotNull(message = "practice.errors.subjectRequired")
  private Long subjectId;

  private Long topicId;

  @NotBlank(message = "practice.errors.scopeTitleRequired")
  private String scopeTitle;
}
