package com.quizapp.system.mapper;

import com.quizapp.system.domain.QuestionOption;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface QuestionOptionMapper {
  List<QuestionOption> selectAll();

  List<QuestionOption> selectByQuestionId(@Param("questionId") Long questionId);
}
