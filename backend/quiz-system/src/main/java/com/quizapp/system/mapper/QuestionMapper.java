package com.quizapp.system.mapper;

import com.quizapp.system.domain.Question;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface QuestionMapper {
  List<Question> selectAll();

  Question selectById(@Param("id") Long id);

  List<Question> selectBySubjectId(@Param("subjectId") Long subjectId);

  List<Question> selectByTopicId(@Param("topicId") Long topicId);

  List<Question> selectBySubjectIdAndTopicIds(
      @Param("subjectId") Long subjectId,
      @Param("topicIds") List<Long> topicIds
  );
}
