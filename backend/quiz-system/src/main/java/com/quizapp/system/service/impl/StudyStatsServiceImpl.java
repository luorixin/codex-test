package com.quizapp.system.service.impl;

import com.quizapp.exception.ServiceException;
import com.quizapp.system.domain.vo.DailyPracticeStatVo;
import com.quizapp.system.domain.vo.HomeOverviewVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubjectProgressStatVo;
import com.quizapp.system.domain.vo.TopicProgressSnapshotVo;
import com.quizapp.system.domain.vo.TopicProgressStatVo;
import com.quizapp.system.mapper.StudyRecordQueryMapper;
import com.quizapp.system.service.ICurrentUserService;
import com.quizapp.system.service.IPracticeSessionService;
import com.quizapp.system.service.IStudyStatsService;
import com.quizapp.system.service.ITopicService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class StudyStatsServiceImpl implements IStudyStatsService {

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

  private final ICurrentUserService currentUserService;
  private final StudyRecordQueryMapper studyRecordQueryMapper;
  private final IPracticeSessionService practiceSessionService;
  private final ITopicService topicService;

  public StudyStatsServiceImpl(
      ICurrentUserService currentUserService,
      StudyRecordQueryMapper studyRecordQueryMapper,
      IPracticeSessionService practiceSessionService,
      ITopicService topicService
  ) {
    this.currentUserService = currentUserService;
    this.studyRecordQueryMapper = studyRecordQueryMapper;
    this.practiceSessionService = practiceSessionService;
    this.topicService = topicService;
  }

  @Override
  public HomeOverviewVo getHomeOverview() {
    Long userId = currentUserService.getCurrentUserId();
    String activeSince = LocalDate.now().minusDays(6).format(DATE_FORMATTER);
    HomeOverviewVo overview = studyRecordQueryMapper.selectHomeOverview(userId, activeSince);
    return overview == null ? new HomeOverviewVo(0, 0, 0, 0, 0, 0, 0, 0, 0, 0) : overview;
  }

  @Override
  public PracticeSessionSummaryVo getRecentPractice() {
    return practiceSessionService.getLatestSessionSummary();
  }

  @Override
  public List<PracticeSessionSummaryVo> getRecentPracticeSessions(int limit) {
    return studyRecordQueryMapper.selectRecentPracticeSessions(
        currentUserService.getCurrentUserId(),
        limit
    );
  }

  @Override
  public List<DailyPracticeStatVo> getDailyPracticeStats(String startDate, String endDate) {
    LocalDate start = parseDate(startDate);
    LocalDate end = parseDate(endDate);
    if (start.isAfter(end)) {
      throw new ServiceException(400, "stats.errors.invalidDateRange");
    }

    List<DailyPracticeStatVo> rows = studyRecordQueryMapper.selectDailyPracticeStats(
        currentUserService.getCurrentUserId(),
        startDate,
        endDate
    );
    Map<String, DailyPracticeStatVo> rowMap = new LinkedHashMap<>();
    for (DailyPracticeStatVo row : rows) {
      row.setLabel(row.getDateKey().length() >= 10 ? row.getDateKey().substring(5).replace('-', '/') : row.getDateKey());
      rowMap.put(row.getDateKey(), row);
    }

    List<DailyPracticeStatVo> result = new ArrayList<>();
    LocalDate cursor = start;
    while (!cursor.isAfter(end)) {
      String dateKey = cursor.format(DATE_FORMATTER);
      result.add(rowMap.getOrDefault(
          dateKey,
          new DailyPracticeStatVo(dateKey, dateKey.substring(5).replace('-', '/'), 0, 0)
      ));
      cursor = cursor.plusDays(1);
    }

    return result;
  }

  @Override
  public List<SubjectProgressStatVo> getSubjectProgressStats() {
    return studyRecordQueryMapper.selectSubjectProgressStats(currentUserService.getCurrentUserId())
        .stream()
        .peek(row -> {
          row.setCompletionRate(calculateRate(row.getAnsweredQuestions(), row.getTotalQuestions()));
          row.setAccuracyRate(calculateRate(row.getCorrectCount(), row.getAnswerCount()));
        })
        .toList();
  }

  @Override
  public List<TopicProgressStatVo> getTopicProgressStats() {
    return studyRecordQueryMapper.selectTopicProgressStats(currentUserService.getCurrentUserId())
        .stream()
        .peek(row -> {
          row.setCompletionRate(calculateRate(row.getAnsweredQuestions(), row.getTotalQuestions()));
          row.setAccuracyRate(calculateRate(row.getCorrectCount(), row.getAnswerCount()));
        })
        .sorted(Comparator
            .comparingInt(TopicProgressStatVo::getCompletionRate).reversed()
            .thenComparing(Comparator.comparingInt(TopicProgressStatVo::getAccuracyRate).reversed())
            .thenComparing(TopicProgressStatVo::getTopicName))
        .toList();
  }

  @Override
  public TopicProgressSnapshotVo getTopicProgressSnapshot(Long topicId) {
    topicService.selectById(topicId);
    TopicProgressSnapshotVo snapshot = studyRecordQueryMapper.selectTopicProgressSnapshot(
        currentUserService.getCurrentUserId(),
        topicId
    );
    return snapshot == null ? new TopicProgressSnapshotVo(0, 0, 0, 0) : snapshot;
  }

  private int calculateRate(int numerator, int denominator) {
    if (denominator == 0) {
      return 0;
    }
    return Math.round((numerator * 100f) / denominator);
  }

  private LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value, DATE_FORMATTER);
    } catch (Exception e) {
      throw new ServiceException(400, "stats.errors.invalidDateRange");
    }
  }
}
