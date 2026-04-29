import { getRecentPracticeSessionFromApi } from '@/src/api/homeApi';
import { ttlCache } from '@/src/cache/ttlCache';
import { isBackendApiEnabled } from '@/src/config/runtime';
import { getLatestPracticeSessionSummary } from '@/src/db/repositories/practiceRepository';
import { listSubjects } from '@/src/services/catalog/catalogService';
import { listHomeResources } from '@/src/services/resources/resourceService';
import { getHomeOverview } from '@/src/services/stats/statsService';
import type { HomeScreenData } from '@/src/types/domain';

const HOME_CACHE_TTL = 30_000;

export async function getHomeScreenData(): Promise<HomeScreenData> {
  const cached = ttlCache.get<HomeScreenData>('home:screenData');

  if (cached) {
    return cached;
  }

  const [subjects, overview, recentSession, resources] = await Promise.all([
    listSubjects(),
    getHomeOverview(),
    isBackendApiEnabled()
      ? getRecentPracticeSessionFromApi()
      : getLatestPracticeSessionSummary(),
    listHomeResources(),
  ]);

  const data: HomeScreenData = {
    subjects,
    overview,
    recentSession,
    resources,
  };

  ttlCache.set('home:screenData', data, HOME_CACHE_TTL);
  return data;
}
