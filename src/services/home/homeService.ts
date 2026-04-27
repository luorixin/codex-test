import { ttlCache } from '@/src/cache/ttlCache';
import { getLatestPracticeSessionSummary } from '@/src/db/repositories/practiceRepository';
import { listSubjects } from '@/src/services/catalog/catalogService';
import { getHomeOverview } from '@/src/services/stats/statsService';
import type { HomeScreenData } from '@/src/types/domain';

const HOME_CACHE_TTL = 30_000;

export async function getHomeScreenData(): Promise<HomeScreenData> {
  const cached = ttlCache.get<HomeScreenData>('home:screenData');

  if (cached) {
    return cached;
  }

  const [subjects, overview, recentSession] = await Promise.all([
    listSubjects(),
    getHomeOverview(),
    getLatestPracticeSessionSummary(),
  ]);

  const data: HomeScreenData = {
    subjects,
    overview,
    recentSession,
  };

  ttlCache.set('home:screenData', data, HOME_CACHE_TTL);
  return data;
}
