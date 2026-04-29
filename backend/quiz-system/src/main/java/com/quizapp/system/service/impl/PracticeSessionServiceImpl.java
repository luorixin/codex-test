package com.quizapp.system.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quizapp.enums.PracticeMode;
import com.quizapp.exception.ServiceException;
import com.quizapp.system.domain.PracticeSession;
import com.quizapp.system.domain.Question;
import com.quizapp.system.domain.QuestionOption;
import com.quizapp.system.domain.UserAnswer;
import com.quizapp.system.domain.WrongBookItem;
import com.quizapp.system.domain.dto.CreatePracticeSessionBody;
import com.quizapp.system.domain.dto.SubmitPracticeAnswerBody;
import com.quizapp.system.domain.vo.CreatePracticeSessionVo;
import com.quizapp.system.domain.vo.PracticeAnswerRecordVo;
import com.quizapp.system.domain.vo.PracticeQuestionOptionVo;
import com.quizapp.system.domain.vo.PracticeQuestionVo;
import com.quizapp.system.domain.vo.PracticeSessionStateVo;
import com.quizapp.system.domain.vo.PracticeSessionSummaryVo;
import com.quizapp.system.domain.vo.SubmitPracticeAnswerVo;
import com.quizapp.system.mapper.PracticeQueryMapper;
import com.quizapp.system.mapper.PracticeSessionMapper;
import com.quizapp.system.mapper.PracticeSessionQuestionMapper;
import com.quizapp.system.mapper.QuestionMapper;
import com.quizapp.system.mapper.QuestionOptionMapper;
import com.quizapp.system.mapper.StudyRecordQueryMapper;
import com.quizapp.system.mapper.SubjectMapper;
import com.quizapp.system.mapper.TopicMapper;
import com.quizapp.system.mapper.UserAnswerMapper;
import com.quizapp.system.mapper.WrongBookItemMapper;
import com.quizapp.system.service.ICurrentUserService;
import com.quizapp.system.service.IPracticeSessionService;
import com.quizapp.system.service.ITopicService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PracticeSessionServiceImpl implements IPracticeSessionService {

  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

  private final ICurrentUserService currentUserService;
  private final PracticeSessionMapper practiceSessionMapper;
  private final PracticeSessionQuestionMapper practiceSessionQuestionMapper;
  private final PracticeQueryMapper practiceQueryMapper;
  private final StudyRecordQueryMapper studyRecordQueryMapper;
  private final UserAnswerMapper userAnswerMapper;
  private final WrongBookItemMapper wrongBookItemMapper;
  private final QuestionMapper questionMapper;
  private final QuestionOptionMapper questionOptionMapper;
  private final SubjectMapper subjectMapper;
  private final TopicMapper topicMapper;
  private final ITopicService topicService;
  private final ObjectMapper objectMapper;

  public PracticeSessionServiceImpl(
      ICurrentUserService currentUserService,
      PracticeSessionMapper practiceSessionMapper,
      PracticeSessionQuestionMapper practiceSessionQuestionMapper,
      PracticeQueryMapper practiceQueryMapper,
      StudyRecordQueryMapper studyRecordQueryMapper,
      UserAnswerMapper userAnswerMapper,
      WrongBookItemMapper wrongBookItemMapper,
      QuestionMapper questionMapper,
      QuestionOptionMapper questionOptionMapper,
      SubjectMapper subjectMapper,
      TopicMapper topicMapper,
      ITopicService topicService,
      ObjectMapper objectMapper
  ) {
    this.currentUserService = currentUserService;
    this.practiceSessionMapper = practiceSessionMapper;
    this.practiceSessionQuestionMapper = practiceSessionQuestionMapper;
    this.practiceQueryMapper = practiceQueryMapper;
    this.studyRecordQueryMapper = studyRecordQueryMapper;
    this.userAnswerMapper = userAnswerMapper;
    this.wrongBookItemMapper = wrongBookItemMapper;
    this.questionMapper = questionMapper;
    this.questionOptionMapper = questionOptionMapper;
    this.subjectMapper = subjectMapper;
    this.topicMapper = topicMapper;
    this.topicService = topicService;
    this.objectMapper = objectMapper;
  }

  @Override
  @Transactional
  public CreatePracticeSessionVo createSession(CreatePracticeSessionBody body) {
    Long userId = currentUserService.getCurrentUserId();
    String mode = normalizeMode(body.getMode());

    List<Long> questionIds = switch (mode) {
      case "topic_practice" -> resolveTopicPracticeQuestionIds(body.getSubjectId(), body.getTopicId());
      case "wrong_book" -> studyRecordQueryMapper.selectWrongBookQuestions(
          userId,
          body.getSubjectId(),
          body.getTopicId(),
          false
      ).stream().map(row -> Long.parseLong(row.getQuestionId())).toList();
      default -> throw new ServiceException(400, "practice.errors.modeInvalid");
    };

    if (questionIds.isEmpty()) {
      throw new ServiceException(400, "wrong_book".equals(mode)
          ? "practice.errors.noWrongBookQuestions"
          : "practice.errors.noQuestions");
    }

    PracticeSession session = new PracticeSession();
    session.setId(UUID.randomUUID().toString());
    session.setUserId(userId);
    session.setMode(mode);
    session.setSubjectId(body.getSubjectId());
    session.setTopicId(body.getTopicId());
    session.setScopeTitle(body.getScopeTitle().trim());
    session.setQuestionCount(questionIds.size());
    session.setCorrectCount(0);
    session.setStartedAt(LocalDateTime.now());
    session.setFinishedAt(null);

    practiceSessionMapper.insert(session);
    practiceSessionQuestionMapper.batchInsert(session.getId(), questionIds);

    PracticeSessionSummaryVo summary = new PracticeSessionSummaryVo(
        session.getId(),
        session.getMode(),
        session.getTopicId() == null ? null : String.valueOf(session.getTopicId()),
        session.getScopeTitle(),
        requireSubjectName(session.getSubjectId()),
        session.getQuestionCount(),
        session.getCorrectCount(),
        formatDateTime(session.getStartedAt()),
        null
    );

    return new CreatePracticeSessionVo(session.getId(), summary);
  }

  @Override
  public PracticeSessionStateVo getSessionState(String sessionId) {
    Long userId = currentUserService.getCurrentUserId();
    PracticeSession session = requireSession(sessionId, userId);

    var detail = new com.quizapp.system.domain.vo.PracticeSessionDetailVo(
        session.getId(),
        session.getMode(),
        String.valueOf(session.getSubjectId()),
        requireSubjectName(session.getSubjectId()),
        session.getTopicId() == null ? null : String.valueOf(session.getTopicId()),
        session.getScopeTitle(),
        formatDateTime(session.getStartedAt()),
        formatDateTime(session.getFinishedAt()),
        session.getQuestionCount(),
        session.getCorrectCount()
    );

    List<PracticeQuestionVo> questions = practiceQueryMapper.selectQuestionsBySessionId(sessionId, userId);
    Map<String, List<PracticeQuestionOptionVo>> optionsByQuestionId = practiceQueryMapper
        .selectOptionsBySessionId(sessionId, userId)
        .stream()
        .collect(Collectors.groupingBy(
            PracticeQuestionOptionVo::getQuestionId,
            LinkedHashMap::new,
            Collectors.toList()
        ));

    for (PracticeQuestionVo question : questions) {
      question.setOptions(optionsByQuestionId.getOrDefault(question.getId(), List.of()));
    }

    List<PracticeAnswerRecordVo> answers = userAnswerMapper.selectBySessionIdAndUserId(sessionId, userId)
        .stream()
        .map(this::toAnswerRecordVo)
        .toList();

    return new PracticeSessionStateVo(detail, questions, answers);
  }

  @Override
  @Transactional
  public SubmitPracticeAnswerVo submitAnswer(String sessionId, SubmitPracticeAnswerBody body) {
    Long userId = currentUserService.getCurrentUserId();
    PracticeSession session = requireSession(sessionId, userId);

    if (session.getFinishedAt() != null) {
      throw new ServiceException(400, "practice.errors.sessionFinished");
    }

    Long questionId = parseQuestionId(body.getQuestionId());
    if (practiceSessionQuestionMapper.countBySessionIdAndQuestionId(sessionId, questionId) == 0) {
      throw new ServiceException(404, "practice.errors.questionNotInSession");
    }

    if (userAnswerMapper.selectBySessionIdAndQuestionId(sessionId, questionId, userId) != null) {
      throw new ServiceException(409, "practice.errors.answerAlreadySubmitted");
    }

    Question question = questionMapper.selectById(questionId);
    if (question == null) {
      throw new ServiceException(404, "question.errors.notFound");
    }

    List<QuestionOption> options = questionOptionMapper.selectByQuestionId(questionId);
    Set<String> allowedKeys = options.stream()
        .map(QuestionOption::getOptionKey)
        .collect(Collectors.toSet());
    List<String> selectedOptionKeys = normalizeSelection(body.getSelectedOptionKeys(), allowedKeys);
    List<String> correctOptionKeys = options.stream()
        .filter(option -> option.getIsCorrect() != null && option.getIsCorrect() == 1)
        .map(QuestionOption::getOptionKey)
        .sorted()
        .toList();

    boolean isCorrect = new TreeSet<>(selectedOptionKeys).equals(new TreeSet<>(correctOptionKeys));
    LocalDateTime answeredAt = LocalDateTime.now();

    UserAnswer answer = new UserAnswer();
    answer.setId(UUID.randomUUID().toString());
    answer.setSessionId(sessionId);
    answer.setUserId(userId);
    answer.setQuestionId(questionId);
    answer.setSelectedOptionKeys(writeSelection(selectedOptionKeys));
    answer.setIsCorrect(isCorrect ? 1 : 0);
    answer.setAnsweredAt(answeredAt);
    userAnswerMapper.insert(answer);

    syncWrongBookItem(sessionId, userId, question, answeredAt, isCorrect);

    List<UserAnswer> answers = userAnswerMapper.selectBySessionIdAndUserId(sessionId, userId);
    int correctCount = (int) answers.stream().filter(item -> item.getIsCorrect() != null && item.getIsCorrect() == 1).count();
    boolean isFinished = answers.size() >= session.getQuestionCount();
    LocalDateTime finishedAt = isFinished ? answeredAt : null;

    practiceSessionMapper.updateProgress(sessionId, userId, correctCount, finishedAt);

    return new SubmitPracticeAnswerVo(
        toAnswerRecordVo(answer),
        correctOptionKeys,
        isFinished,
        correctCount,
        answers.size()
    );
  }

  @Override
  public PracticeSessionSummaryVo getLatestSessionSummary() {
    Long userId = currentUserService.getCurrentUserId();
    return practiceQueryMapper.selectLatestSessionSummary(userId);
  }

  private PracticeSession requireSession(String sessionId, Long userId) {
    PracticeSession session = practiceSessionMapper.selectByIdAndUserId(sessionId, userId);
    if (session == null) {
      throw new ServiceException(404, "practice.errors.sessionMissing");
    }
    return session;
  }

  private List<Long> resolveTopicPracticeQuestionIds(Long subjectId, Long topicId) {
    if (topicId == null || topicMapper.selectById(topicId) == null) {
      throw new ServiceException(404, "practice.errors.topicMissing");
    }

    var topicIds = topicService.resolveTopicIds(topicId, true);
    List<Question> questions = questionMapper.selectBySubjectIdAndTopicIds(subjectId, List.copyOf(topicIds));
    return questions.stream().map(Question::getId).toList();
  }

  private String normalizeMode(String mode) {
    if (PracticeMode.TOPIC_PRACTICE.getValue().equals(mode)) {
      return PracticeMode.TOPIC_PRACTICE.getValue();
    }
    if (PracticeMode.WRONG_BOOK.getValue().equals(mode)) {
      return PracticeMode.WRONG_BOOK.getValue();
    }
    throw new ServiceException(400, "practice.errors.modeInvalid");
  }

  private Long parseQuestionId(String questionId) {
    try {
      return Long.parseLong(questionId);
    } catch (NumberFormatException e) {
      throw new ServiceException(400, "answer.errors.invalidQuestionId");
    }
  }

  private List<String> normalizeSelection(List<String> selectedOptionKeys, Set<String> allowedKeys) {
    List<String> normalized = selectedOptionKeys == null ? List.of() : selectedOptionKeys.stream()
        .filter(value -> value != null && !value.isBlank())
        .map(String::trim)
        .distinct()
        .sorted()
        .toList();

    if (normalized.isEmpty()) {
      throw new ServiceException(400, "answer.errors.emptySelection");
    }

    for (String optionKey : normalized) {
      if (!allowedKeys.contains(optionKey)) {
        throw new ServiceException(400, "answer.errors.invalidOptionKey");
      }
    }

    return normalized;
  }

  private String writeSelection(List<String> selectedOptionKeys) {
    try {
      return objectMapper.writeValueAsString(selectedOptionKeys);
    } catch (JsonProcessingException e) {
      throw new ServiceException("common.errors.internalServerError", e);
    }
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

  private void syncWrongBookItem(
      String sessionId,
      Long userId,
      Question question,
      LocalDateTime answeredAt,
      boolean isCorrect
  ) {
    WrongBookItem item = wrongBookItemMapper.selectByUserIdAndQuestionId(userId, question.getId());

    if (!isCorrect) {
      if (item == null) {
        WrongBookItem created = new WrongBookItem();
        created.setUserId(userId);
        created.setQuestionId(question.getId());
        created.setSubjectId(question.getSubjectId());
        created.setTopicId(question.getTopicId());
        created.setFirstWrongAt(answeredAt);
        created.setLastWrongAt(answeredAt);
        created.setWrongCount(1);
        created.setLastSessionId(sessionId);
        created.setResolved(0);
        wrongBookItemMapper.insert(created);
        return;
      }

      item.setSubjectId(question.getSubjectId());
      item.setTopicId(question.getTopicId());
      item.setLastWrongAt(answeredAt);
      item.setWrongCount((item.getWrongCount() == null ? 0 : item.getWrongCount()) + 1);
      item.setLastSessionId(sessionId);
      item.setResolved(0);
      wrongBookItemMapper.update(item);
      return;
    }

    if (item != null) {
      item.setSubjectId(question.getSubjectId());
      item.setTopicId(question.getTopicId());
      item.setLastSessionId(sessionId);
      item.setResolved(1);
      wrongBookItemMapper.update(item);
    }
  }

  private String requireSubjectName(Long subjectId) {
    var subject = subjectMapper.selectById(subjectId);
    if (subject == null) {
      throw new ServiceException(404, "subject.errors.notFound");
    }
    return subject.getName();
  }

  private String formatDateTime(LocalDateTime value) {
    return value == null ? null : value.format(ISO_FORMATTER);
  }
}
