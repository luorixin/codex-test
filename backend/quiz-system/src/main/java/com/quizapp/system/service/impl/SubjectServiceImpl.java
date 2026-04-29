package com.quizapp.system.service.impl;

import com.quizapp.system.domain.Subject;
import com.quizapp.system.mapper.SubjectMapper;
import com.quizapp.system.service.ISubjectService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SubjectServiceImpl implements ISubjectService {
  private final SubjectMapper subjectMapper;

  public SubjectServiceImpl(SubjectMapper subjectMapper) {
    this.subjectMapper = subjectMapper;
  }

  @Override
  public List<Subject> selectAll() {
    return subjectMapper.selectAll();
  }
}
