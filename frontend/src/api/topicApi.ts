import { httpClient } from '@/src/api/client';
import type { TopicProgressSnapshot } from '@/src/types/domain';

export async function getTopicProgressSnapshotFromApi(
  topicId: string,
): Promise<TopicProgressSnapshot> {
  return httpClient.get<TopicProgressSnapshot>(`/topics/${topicId}/progress`);
}
