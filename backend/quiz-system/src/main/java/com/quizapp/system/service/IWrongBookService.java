package com.quizapp.system.service;

import com.quizapp.system.domain.vo.WrongBookOverviewVo;
import com.quizapp.system.domain.vo.WrongBookQuestionDetailVo;
import com.quizapp.system.domain.vo.WrongBookQuestionSummaryVo;
import com.quizapp.system.domain.vo.WrongBookSubjectSummaryVo;
import com.quizapp.system.domain.vo.WrongBookTopicSummaryVo;
import java.util.List;

public interface IWrongBookService {
  WrongBookOverviewVo getOverview(Long subjectId);

  List<WrongBookSubjectSummaryVo> listSubjects();

  List<WrongBookTopicSummaryVo> listTopics(Long subjectId);

  List<WrongBookQuestionSummaryVo> listQuestions(Long subjectId, Long topicId, boolean includeResolved);

  WrongBookQuestionDetailVo getQuestionDetail(Long questionId);
}
