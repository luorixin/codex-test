package com.quizapp.system.service;

import com.quizapp.system.domain.Question;
import com.quizapp.system.domain.QuestionOption;
import com.quizapp.system.domain.dto.AnswerBody;
import com.quizapp.system.domain.vo.AnswerVo;
import com.quizapp.system.domain.vo.CatalogSnapshotVo;
import java.util.List;

public interface IQuestionService {
  CatalogSnapshotVo getSnapshot();

  List<Question> getQuestions(Long subjectId, Long topicId, boolean includeDescendants);

  List<QuestionOption> getOptionsByQuestionId(Long questionId);

  List<String> getCorrectOptionKeys(Long questionId);

  AnswerVo evaluate(AnswerBody body);
}
