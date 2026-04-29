package com.quizapp.system.mapper;

import com.quizapp.system.domain.WrongBookItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WrongBookItemMapper {
  WrongBookItem selectByUserIdAndQuestionId(
      @Param("userId") Long userId,
      @Param("questionId") Long questionId
  );

  int insert(WrongBookItem item);

  int update(WrongBookItem item);
}
