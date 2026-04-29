import { getTopicProgressSnapshotFromApi } from '@/src/api/topicApi';
import { ttlCache } from '@/src/cache/ttlCache';
import { isBackendApiEnabled } from '@/src/config/runtime';
import { getTopicProgressSnapshot } from '@/src/db/repositories/topicRepository';
import {
  getQuestionsForPractice,
  getSubjectById,
  getTopicById,
  listChildTopics,
  listRootTopicsBySubject,
} from '@/src/services/catalog/catalogService';
import type {
  PracticeIntroData,
  SubjectScreenData,
  TopicProgressSnapshot,
  TopicScreenData,
} from '@/src/types/domain';

const TOPIC_CACHE_TTL = 30_000;

async function getCachedTopicProgress(topicId: string): Promise<TopicProgressSnapshot | null> {
  const cacheKey = `topic:progress:${topicId}`;
  const cached = ttlCache.get<TopicProgressSnapshot | null>(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const snapshot = isBackendApiEnabled()
    ? await getTopicProgressSnapshotFromApi(topicId)
    : await getTopicProgressSnapshot(topicId);
  ttlCache.set(cacheKey, snapshot, TOPIC_CACHE_TTL);
  return snapshot;
}

export async function getSubjectScreenData(subjectId: string): Promise<SubjectScreenData> {
  const [subject, topics] = await Promise.all([
    getSubjectById(subjectId),
    listRootTopicsBySubject(subjectId),
  ]);

  return {
    subject,
    topics,
  };
}

export async function getTopicScreenData(topicId: string): Promise<TopicScreenData> {
  const [topic, snapshot, children, questions] = await Promise.all([
    getTopicById(topicId),
    getCachedTopicProgress(topicId),
    listChildTopics(topicId),
    getQuestionsForPractice(topicId),
  ]);

  return {
    topic,
    snapshot: snapshot
      ? {
          ...snapshot,
          questionCount: questions.length,
        }
      : topic
        ? {
            childTopicCount: children.length,
            questionCount: questions.length,
            answeredCount: 0,
            wrongCount: 0,
          }
        : null,
    children,
  };
}

export async function getPracticeIntroData(topicId: string): Promise<PracticeIntroData> {
  const [topic, snapshot, questions] = await Promise.all([
    getTopicById(topicId),
    getCachedTopicProgress(topicId),
    getQuestionsForPractice(topicId),
  ]);

  return {
    topic,
    snapshot: snapshot
      ? {
          ...snapshot,
          questionCount: questions.length,
        }
      : topic
        ? {
            childTopicCount: 0,
            questionCount: questions.length,
            answeredCount: 0,
            wrongCount: 0,
          }
        : null,
  };
}
