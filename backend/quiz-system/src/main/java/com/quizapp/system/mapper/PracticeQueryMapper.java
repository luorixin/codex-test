package com.quizapp.system.mapper;

import com.quizapp.system.domain.vo.PracticeQuestionOptionVo;
import com.quizapp.system.domain.vo.PracticeQuestionVo;
import com.quizapp.system.domain.vo.PracticeSessionDetailVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PracticeQueryMapper {
  PracticeSessionDetailVo selectSessionDetail(
      @Param("sessionId") String sessionId,
      @Param("userId") Long userId
  );

  List<PracticeQuestionVo> selectQuestionsBySessionId(
      @Param("sessionId") String sessionId,
      @Param("userId") Long userId
  );

  List<PracticeQuestionOptionVo> selectOptionsBySessionId(
      @Param("sessionId") String sessionId,
      @Param("userId") Long userId
  );

  PracticeSessionSummaryVo selectLatestSessionSummary(@Param("userId") Long userId);
}
