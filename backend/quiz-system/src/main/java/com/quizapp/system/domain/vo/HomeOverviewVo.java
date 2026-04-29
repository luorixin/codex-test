package com.quizapp.system.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HomeOverviewVo {
  private int subjectCount;
  private int topicCount;
  private int questionCount;
  private int totalSessions;
  private int completedSessions;
  private int totalAnswers;
  private int correctAnswers;
  private int answeredUniqueQuestions;
  private int unresolvedWrongCount;
  private int activeDaysLast7;
}
