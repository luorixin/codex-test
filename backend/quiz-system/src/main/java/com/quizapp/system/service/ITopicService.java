package com.quizapp.system.service;

import com.quizapp.system.domain.Topic;
import java.util.List;
import java.util.Set;

public interface ITopicService {
  List<Topic> selectAll();

  Topic selectById(Long id);

  Set<Long> resolveTopicIds(Long topicId, boolean includeDescendants);
}
