package com.quizapp.system.mapper;

import com.quizapp.system.domain.PracticeSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PracticeSessionMapper {
  int insert(PracticeSession session);

  PracticeSession selectByIdAndUserId(@Param("id") String id, @Param("userId") Long userId);

  int updateProgress(
      @Param("id") String id,
      @Param("userId") Long userId,
      @Param("correctCount") Integer correctCount,
      @Param("finishedAt") java.time.LocalDateTime finishedAt
  );
}
