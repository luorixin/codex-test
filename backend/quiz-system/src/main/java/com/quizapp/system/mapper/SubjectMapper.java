package com.quizapp.system.mapper;

import com.quizapp.system.domain.Subject;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SubjectMapper {
  List<Subject> selectAll();

  Subject selectById(Long id);
}
