package com.quizapp.system.mapper;

import com.quizapp.system.domain.Topic;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TopicMapper {
  List<Topic> selectAll();

  Topic selectById(@Param("id") Long id);

  List<Topic> selectBySubjectId(@Param("subjectId") Long subjectId);

  List<Topic> selectByParentId(@Param("parentId") Long parentId);
}
