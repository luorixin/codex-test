package com.quizapp.system.mapper;

import com.quizapp.system.domain.UserAnswer;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserAnswerMapper {
  int insert(UserAnswer answer);

  UserAnswer selectBySessionIdAndQuestionId(
      @Param("sessionId") String sessionId,
      @Param("questionId") Long questionId,
      @Param("userId") Long userId
  );

  List<UserAnswer> selectBySessionIdAndUserId(
      @Param("sessionId") String sessionId,
      @Param("userId") Long userId
  );

  List<UserAnswer> selectRecentByUserIdAndQuestionId(
      @Param("userId") Long userId,
      @Param("questionId") Long questionId,
      @Param("limit") Integer limit
  );
}
