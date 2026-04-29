package com.quizapp.system.service.impl;

import com.quizapp.exception.ServiceException;
import com.quizapp.system.domain.Topic;
import com.quizapp.system.mapper.TopicMapper;
import com.quizapp.system.service.ITopicService;
import java.util.ArrayDeque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class TopicServiceImpl implements ITopicService {
  private final TopicMapper topicMapper;

  public TopicServiceImpl(TopicMapper topicMapper) {
    this.topicMapper = topicMapper;
  }

  @Override
  public List<Topic> selectAll() {
    return topicMapper.selectAll();
  }

  @Override
  public Topic selectById(Long id) {
    Topic topic = topicMapper.selectById(id);
    if (topic == null) {
      throw new ServiceException("topic.errors.notFound");
    }
    return topic;
  }

  @Override
  public Set<Long> resolveTopicIds(Long topicId, boolean includeDescendants) {
    if (topicId == null) {
      return null;
    }

    Topic topic = topicMapper.selectById(topicId);
    if (topic == null) {
      throw new ServiceException("topic.errors.notFound");
    }

    if (!includeDescendants) {
      return Set.of(topicId);
    }

    Set<Long> visited = new LinkedHashSet<>();
    ArrayDeque<Long> queue = new ArrayDeque<>();
    queue.add(topicId);

    while (!queue.isEmpty()) {
      Long current = queue.removeFirst();
      if (!visited.add(current)) {
        continue;
      }

      for (Topic child : topicMapper.selectByParentId(current)) {
        queue.addLast(child.getId());
      }
    }

    return visited;
  }
}
