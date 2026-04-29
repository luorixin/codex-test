package com.quizapp.system.mapper;

import com.quizapp.system.domain.vo.DailyPracticeStatVo;
import com.quizapp.system.domain.vo.HomeOverviewVo;
import com.quizapp.system.domain.vo.PracticeQuestionOptionVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubjectProgressStatVo;
import com.quizapp.system.domain.vo.TopicProgressSnapshotVo;
import com.quizapp.system.domain.vo.TopicProgressStatVo;
import com.quizapp.system.domain.vo.WrongBookOverviewVo;
import com.quizapp.system.domain.vo.WrongBookQuestionDetailVo;
import com.quizapp.system.domain.vo.WrongBookQuestionSummaryVo;
import com.quizapp.system.domain.vo.WrongBookSubjectSummaryVo;
import com.quizapp.system.domain.vo.WrongBookTopicSummaryVo;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface StudyRecordQueryMapper {
  WrongBookOverviewVo selectWrongBookOverview(
      @Param("userId") Long userId,
      @Param("subjectId") Long subjectId
  );

  List<WrongBookSubjectSummaryVo> selectWrongBookSubjects(@Param("userId") Long userId);

  List<WrongBookTopicSummaryVo> selectWrongBookTopics(
      @Param("userId") Long userId,
      @Param("subjectId") Long subjectId
  );

  List<WrongBookQuestionSummaryVo> selectWrongBookQuestions(
      @Param("userId") Long userId,
      @Param("subjectId") Long subjectId,
      @Param("topicId") Long topicId,
      @Param("includeResolved") boolean includeResolved
  );

  WrongBookQuestionDetailVo selectWrongBookQuestionDetail(
      @Param("userId") Long userId,
      @Param("questionId") Long questionId
  );

  List<PracticeQuestionOptionVo> selectQuestionOptions(@Param("questionId") Long questionId);

  HomeOverviewVo selectHomeOverview(
      @Param("userId") Long userId,
      @Param("activeSince") String activeSince
  );

  List<DailyPracticeStatVo> selectDailyPracticeStats(
      @Param("userId") Long userId,
      @Param("startDate") String startDate,
      @Param("endDate") String endDate
  );

  List<SubjectProgressStatVo> selectSubjectProgressStats(@Param("userId") Long userId);

  List<TopicProgressStatVo> selectTopicProgressStats(@Param("userId") Long userId);

  List<PracticeSessionSummaryVo> selectRecentPracticeSessions(
      @Param("userId") Long userId,
      @Param("limit") Integer limit
  );

  TopicProgressSnapshotVo selectTopicProgressSnapshot(
      @Param("userId") Long userId,
      @Param("topicId") Long topicId
  );
}
