package com.quizapp.system.mapper;

import com.quizapp.system.domain.PracticeSessionQuestion;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PracticeSessionQuestionMapper {
  int batchInsert(
      @Param("sessionId") String sessionId,
      @Param("questionIds") List<Long> questionIds
  );

  int countBySessionIdAndQuestionId(
      @Param("sessionId") String sessionId,
      @Param("questionId") Long questionId
  );

  List<PracticeSessionQuestion> selectBySessionId(@Param("sessionId") String sessionId);
}
