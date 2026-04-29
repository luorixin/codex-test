import {
  getFullCatalogSnapshot,
  getQuestionsByIds as getQuestionsByIdsFromProvider,
  getQuestionsByTopic as getQuestionsByTopicFromProvider,
  getSubjects as getSubjectsFromProvider,
  getTopicDetail as getTopicDetailFromProvider,
  getTopicsBySubject as getTopicsBySubjectFromProvider,
} from '@/src/api/providers/catalogProvider';
import {
  getChildTopicsFromCache,
  getQuestionsByIdsFromCache,
  getQuestionsByTopicFromCache,
  getSubjectFromCache,
  getSubjectsFromCache,
  getTopicDetailFromCache,
  getTopicsBySubjectFromCache,
  saveCatalogSnapshot,
} from '@/src/cache/catalogCache';
import type {
  PracticeQuestion,
  SubjectDetail,
  SubjectSummary,
  TopicDetail,
  TopicTreeSummary,
} from '@/src/types/domain';

let syncPromise: Promise<void> | null = null;

export async function listSubjects(): Promise<SubjectSummary[]> {
  await syncCatalogCacheSafely();
  return getSubjectsFromCache();
}

export async function getSubjectById(subjectId: string): Promise<SubjectDetail | null> {
  await syncCatalogCacheSafely();
  return getSubjectFromCache(subjectId);
}

export async function listRootTopicsBySubject(subjectId: string): Promise<TopicTreeSummary[]> {
  await syncCatalogCacheSafely();
  return getTopicsBySubjectFromCache(subjectId);
}

export async function getTopicById(topicId: string): Promise<TopicDetail | null> {
  await syncCatalogCacheSafely();
  return getTopicDetailFromCache(topicId);
}

export async function listChildTopics(topicId: string): Promise<TopicTreeSummary[]> {
  await syncCatalogCacheSafely();
  return getChildTopicsFromCache(topicId);
}

export async function getQuestionsForPractice(topicId: string): Promise<PracticeQuestion[]> {
  try {
    await syncCatalogCache();
  } catch {
    return getQuestionsByTopicFromCache(topicId, true);
  }

  return getQuestionsByTopicFromCache(topicId, true);
}

export async function getQuestionsByIds(questionIds: string[]): Promise<PracticeQuestion[]> {
  if (questionIds.length === 0) {
    return [];
  }

  try {
    await syncCatalogCache();
  } catch {
    return getQuestionsByIdsFromCache(questionIds);
  }

  return getQuestionsByIdsFromCache(questionIds);
}

async function syncCatalogCacheSafely() {
  try {
    await syncCatalogCache();
  } catch {
    // Fall back to existing cache silently. Pages should still render if cache exists.
  }
}

async function syncCatalogCache() {
  if (!syncPromise) {
    syncPromise = (async () => {
      const snapshot = await getFullCatalogSnapshot();
      await saveCatalogSnapshot(snapshot);
    })().finally(() => {
      syncPromise = null;
    });
  }

  return syncPromise;
}

// Exposed for future real-API rollout tests and targeted cache refreshes.
export async function prefetchCatalog() {
  await syncCatalogCache();
}

// Warm provider endpoints so interface drift is caught even while mock is active.
export async function validateCatalogProviderShape(subjectId?: string, topicId?: string) {
  await getSubjectsFromProvider();

  if (subjectId) {
    await getTopicsBySubjectFromProvider(subjectId);
  }

  if (topicId) {
    await getTopicDetailFromProvider(topicId);
    await getQuestionsByTopicFromProvider(topicId, true);
  }

  await getQuestionsByIdsFromProvider([]);
}
