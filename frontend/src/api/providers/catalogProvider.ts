import { getCatalogSnapshotFromApi } from '@/src/api/catalogApi';
import { getCatalogSnapshotFromMock } from '@/src/api/mock/catalogMock';
import { isBackendApiEnabled } from '@/src/config/runtime';
import type {
  CatalogQuestionDto,
  CatalogSnapshotDto,
  CatalogSubjectDto,
  CatalogTopicDto,
} from '@/src/types/domain';

async function getCatalogSnapshot(): Promise<CatalogSnapshotDto> {
  if (isBackendApiEnabled()) {
    return getCatalogSnapshotFromApi();
  }

  return getCatalogSnapshotFromMock();
}

export async function getSubjects(): Promise<CatalogSubjectDto[]> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.subjects;
}

export async function getTopicsBySubject(subjectId: string): Promise<CatalogTopicDto[]> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.topics.filter((topic) => topic.subjectId === subjectId);
}

export async function getTopicDetail(topicId: string): Promise<CatalogTopicDto | null> {
  const snapshot = await getCatalogSnapshot();
  return snapshot.topics.find((topic) => topic.id === topicId) ?? null;
}

export async function getQuestionsByTopic(
  topicId: string,
  includeDescendants = true,
): Promise<CatalogQuestionDto[]> {
  const snapshot = await getCatalogSnapshot();
  const topicIds = includeDescendants
    ? collectDescendantTopicIds(snapshot.topics, topicId)
    : [topicId];

  return snapshot.questions.filter((question) => topicIds.includes(question.topicId));
}

export async function getQuestionsByIds(questionIds: string[]): Promise<CatalogQuestionDto[]> {
  const snapshot = await getCatalogSnapshot();
  const idSet = new Set(questionIds);
  return snapshot.questions.filter((question) => idSet.has(question.id));
}

export async function getFullCatalogSnapshot(): Promise<CatalogSnapshotDto> {
  return getCatalogSnapshot();
}

function collectDescendantTopicIds(topics: CatalogTopicDto[], rootTopicId: string) {
  const childrenMap = new Map<string, string[]>();

  for (const topic of topics) {
    if (!topic.parentId) {
      continue;
    }

    const childIds = childrenMap.get(topic.parentId) ?? [];
    childIds.push(topic.id);
    childrenMap.set(topic.parentId, childIds);
  }

  const visited = new Set<string>();
  const queue = [rootTopicId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    for (const childId of childrenMap.get(current) ?? []) {
      queue.push(childId);
    }
  }

  return [...visited];
}
