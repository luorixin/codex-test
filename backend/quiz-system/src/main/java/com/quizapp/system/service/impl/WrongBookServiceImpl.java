package com.quizapp.system.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizapp.exception.ServiceException;
import com.quizapp.system.domain.UserAnswer;
import com.quizapp.system.domain.vo.PracticeAnswerRecordVo;
import com.quizapp.system.domain.vo.PracticeQuestionOptionVo;
import com.quizapp.system.domain.vo.WrongBookOverviewVo;
import com.quizapp.system.domain.vo.WrongBookQuestionDetailVo;
import com.quizapp.system.domain.vo.WrongBookQuestionSummaryVo;
import com.quizapp.system.domain.vo.WrongBookSubjectSummaryVo;
import com.quizapp.system.domain.vo.WrongBookTopicSummaryVo;
import com.quizapp.system.mapper.StudyRecordQueryMapper;
import com.quizapp.system.mapper.UserAnswerMapper;
import com.quizapp.system.service.ICurrentUserService;
import com.quizapp.system.service.IWrongBookService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WrongBookServiceImpl implements IWrongBookService {

  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

  private final ICurrentUserService currentUserService;
  private final StudyRecordQueryMapper studyRecordQueryMapper;
  private final UserAnswerMapper userAnswerMapper;
  private final ObjectMapper objectMapper;

  public WrongBookServiceImpl(
      ICurrentUserService currentUserService,
      StudyRecordQueryMapper studyRecordQueryMapper,
      UserAnswerMapper userAnswerMapper,
      ObjectMapper objectMapper
  ) {
    this.currentUserService = currentUserService;
    this.studyRecordQueryMapper = studyRecordQueryMapper;
    this.userAnswerMapper = userAnswerMapper;
    this.objectMapper = objectMapper;
  }

  @Override
  public WrongBookOverviewVo getOverview(Long subjectId) {
    Long userId = currentUserService.getCurrentUserId();
    WrongBookOverviewVo overview = studyRecordQueryMapper.selectWrongBookOverview(userId, subjectId);
    if (overview == null) {
      return new WrongBookOverviewVo(0, 0, 0);
    }
    return overview;
  }

  @Override
  public List<WrongBookSubjectSummaryVo> listSubjects() {
    return studyRecordQueryMapper.selectWrongBookSubjects(currentUserService.getCurrentUserId());
  }

  @Override
  public List<WrongBookTopicSummaryVo> listTopics(Long subjectId) {
    return studyRecordQueryMapper.selectWrongBookTopics(currentUserService.getCurrentUserId(), subjectId);
  }

  @Override
  public List<WrongBookQuestionSummaryVo> listQuestions(Long subjectId, Long topicId, boolean includeResolved) {
    return studyRecordQueryMapper.selectWrongBookQuestions(
        currentUserService.getCurrentUserId(),
        subjectId,
        topicId,
        includeResolved
    );
  }

  @Override
  public WrongBookQuestionDetailVo getQuestionDetail(Long questionId) {
    Long userId = currentUserService.getCurrentUserId();
    WrongBookQuestionDetailVo detail = studyRecordQueryMapper.selectWrongBookQuestionDetail(userId, questionId);
    if (detail == null) {
      throw new ServiceException(404, "wrongBook.errors.questionMissing");
    }

    List<PracticeQuestionOptionVo> options = studyRecordQueryMapper.selectQuestionOptions(questionId);
    List<PracticeAnswerRecordVo> recentAnswers = userAnswerMapper.selectRecentByUserIdAndQuestionId(userId, questionId, 5)
        .stream()
        .map(this::toAnswerRecordVo)
        .toList();

    detail.setCorrectOptionKeys(readSelection(detail.getCorrectOptionKeysPayload()));
    detail.setOptions(options);
    detail.setRecentAnswers(recentAnswers);
    return detail;
  }

  private PracticeAnswerRecordVo toAnswerRecordVo(UserAnswer answer) {
    return new PracticeAnswerRecordVo(
        answer.getId(),
        answer.getSessionId(),
        String.valueOf(answer.getQuestionId()),
        readSelection(answer.getSelectedOptionKeys()),
        answer.getIsCorrect() != null && answer.getIsCorrect() == 1,
        formatDateTime(answer.getAnsweredAt())
    );
  }

  private List<String> readSelection(String payload) {
    if (payload == null || payload.isBlank()) {
      return List.of();
    }
    try {
      return objectMapper.readValue(payload, STRING_LIST_TYPE);
    } catch (JsonProcessingException e) {
      throw new ServiceException("common.errors.internalServerError", e);
    }
  }

  private String formatDateTime(LocalDateTime value) {
    return value == null ? null : value.format(ISO_FORMATTER);
  }
}
