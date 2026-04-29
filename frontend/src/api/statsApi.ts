import { httpClient } from '@/src/api/client';
import type {
  DailyPracticeStat,
  PracticeSessionSummary,
  SubjectProgressStat,
  TopicProgressStat,
} from '@/src/types/domain';

export async function getDailyPracticeStatsFromApi(
  startDate: string,
  endDate: string,
): Promise<DailyPracticeStat[]> {
  return httpClient.get<DailyPracticeStat[]>('/stats/daily', {
    params: { startDate, endDate },
  });
}

export async function getSubjectProgressStatsFromApi(): Promise<SubjectProgressStat[]> {
  return httpClient.get<SubjectProgressStat[]>('/stats/subjects');
}

export async function getTopicProgressStatsFromApi(): Promise<TopicProgressStat[]> {
  return httpClient.get<TopicProgressStat[]>('/stats/topics');
}

export async function getRecentPracticeSessionsFromApi(
  limit = 5,
): Promise<PracticeSessionSummary[]> {
  return httpClient.get<PracticeSessionSummary[]>('/stats/recent-practice', {
    params: { limit },
  });
}
