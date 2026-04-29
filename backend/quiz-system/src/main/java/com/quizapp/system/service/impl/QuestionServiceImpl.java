package com.quizapp.system.service.impl;

import com.quizapp.exception.ServiceException;
import com.quizapp.system.domain.Question;
import com.quizapp.system.domain.QuestionOption;
import com.quizapp.system.domain.dto.AnswerBody;
import com.quizapp.system.domain.vo.*;
import com.quizapp.system.mapper.QuestionMapper;
import com.quizapp.system.mapper.QuestionOptionMapper;
import com.quizapp.system.mapper.SubjectMapper;
import com.quizapp.system.mapper.TopicMapper;
import com.quizapp.system.service.IQuestionService;
import com.quizapp.system.service.ITopicService;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class QuestionServiceImpl implements IQuestionService {
  private final SubjectMapper subjectMapper;
  private final TopicMapper topicMapper;
  private final QuestionMapper questionMapper;
  private final QuestionOptionMapper questionOptionMapper;
  private final ITopicService topicService;

  public QuestionServiceImpl(
      SubjectMapper subjectMapper,
      TopicMapper topicMapper,
      QuestionMapper questionMapper,
      QuestionOptionMapper questionOptionMapper,
      ITopicService topicService
  ) {
    this.subjectMapper = subjectMapper;
    this.topicMapper = topicMapper;
    this.questionMapper = questionMapper;
    this.questionOptionMapper = questionOptionMapper;
    this.topicService = topicService;
  }

  @Override
  public CatalogSnapshotVo getSnapshot() {
    List<SubjectVo> subjects = subjectMapper.selectAll().stream()
        .map(s -> new SubjectVo(s.getId(), s.getName(), s.getSortOrder()))
        .toList();

    List<TopicVo> topics = topicMapper.selectAll().stream()
        .map(t -> new TopicVo(t.getId(), t.getSubjectId(), t.getParentId(), t.getName(), t.getSortOrder()))
        .toList();

    List<QuestionVo> questions = questionMapper.selectAll().stream()
        .map(q -> new QuestionVo(q.getId(), q.getSubjectId(), q.getTopicId(),
            q.getType(), q.getStem(), q.getExplanation(), q.getDifficulty(), q.getSource()))
        .toList();

    List<ClientOptionVo> options = questionOptionMapper.selectAll().stream()
        .map(o -> new ClientOptionVo(o.getId(), o.getQuestionId(), o.getOptionKey(), o.getContent()))
        .toList();

    return new CatalogSnapshotVo(subjects, topics, questions, options);
  }

  @Override
  public List<Question> getQuestions(Long subjectId, Long topicId, boolean includeDescendants) {
    if (topicId != null) {
      Set<Long> topicIds = topicService.resolveTopicIds(topicId, includeDescendants);
      return questionMapper.selectBySubjectIdAndTopicIds(subjectId, topicIds != null ? List.copyOf(topicIds) : null);
    }

    if (subjectId != null) {
      return questionMapper.selectBySubjectId(subjectId);
    }

    return questionMapper.selectAll();
  }

  @Override
  public List<QuestionOption> getOptionsByQuestionId(Long questionId) {
    return questionOptionMapper.selectByQuestionId(questionId);
  }

  @Override
  public List<String> getCorrectOptionKeys(Long questionId) {
    Question question = questionMapper.selectById(questionId);
    if (question == null) {
      throw new ServiceException("question.errors.notFound");
    }

    return questionOptionMapper.selectByQuestionId(questionId).stream()
        .filter(o -> o.getIsCorrect() != null && o.getIsCorrect() == 1)
        .map(QuestionOption::getOptionKey)
        .sorted()
        .toList();
  }

  @Override
  public AnswerVo evaluate(AnswerBody body) {
    long questionId;
    try {
      questionId = Long.parseLong(body.getQuestionId());
    } catch (NumberFormatException e) {
      throw new ServiceException(400, "answer.errors.invalidQuestionId");
    }

    Question question = questionMapper.selectById(questionId);
    if (question == null) {
      throw new ServiceException(404, "question.errors.notFound");
    }

    Set<String> allowedKeys = questionOptionMapper.selectByQuestionId(questionId).stream()
        .map(QuestionOption::getOptionKey)
        .collect(Collectors.toSet());

    List<String> normalizedKeys = body.getSelectedOptionKeys().stream()
        .filter(k -> k != null && !k.isBlank())
        .map(String::trim)
        .distinct()
        .sorted()
        .toList();

    if (normalizedKeys.isEmpty()) {
      throw new ServiceException(400, "answer.errors.emptySelection");
    }

    for (String key : normalizedKeys) {
      if (!allowedKeys.contains(key)) {
        throw new ServiceException(400, "answer.errors.invalidOptionKey");
      }
    }

    List<String> correctKeys = getCorrectOptionKeys(questionId);

    boolean isCorrect;
    switch (question.getType()) {
      case "single_choice", "true_false", "multiple_choice" ->
          isCorrect = new TreeSet<>(correctKeys).equals(new TreeSet<>(normalizedKeys));
      default -> isCorrect = false;
    }

    return new AnswerVo(
        String.valueOf(questionId),
        body.getSessionId(),
        isCorrect,
        correctKeys,
        normalizedKeys,
        Instant.now().toString()
    );
  }
}
