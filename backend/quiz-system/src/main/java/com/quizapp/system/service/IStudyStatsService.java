package com.quizapp.system.service;

import com.quizapp.system.domain.vo.DailyPracticeStatVo;
import com.quizapp.system.domain.vo.HomeOverviewVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubjectProgressStatVo;
import com.quizapp.system.domain.vo.TopicProgressSnapshotVo;
import com.quizapp.system.domain.vo.TopicProgressStatVo;
import java.util.List;

public interface IStudyStatsService {
  HomeOverviewVo getHomeOverview();

  PracticeSessionSummaryVo getRecentPractice();

  List<PracticeSessionSummaryVo> getRecentPracticeSessions(int limit);

  List<DailyPracticeStatVo> getDailyPracticeStats(String startDate, String endDate);

  List<SubjectProgressStatVo> getSubjectProgressStats();

  List<TopicProgressStatVo> getTopicProgressStats();

  TopicProgressSnapshotVo getTopicProgressSnapshot(Long topicId);
}
