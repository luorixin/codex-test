import { httpClient } from '@/src/api/client';
import type { HomeOverview, PracticeSessionSummary } from '@/src/types/domain';

export async function getHomeOverviewFromApi(): Promise<HomeOverview> {
  return httpClient.get<HomeOverview>('/home/overview');
}

export async function getRecentPracticeSessionFromApi(): Promise<PracticeSessionSummary | null> {
  return httpClient.get<PracticeSessionSummary | null>('/home/recent-practice');
}
