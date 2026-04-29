package com.quizapp.system.service;

import com.quizapp.system.domain.Subject;
import java.util.List;

public interface ISubjectService {
  List<Subject> selectAll();
}
