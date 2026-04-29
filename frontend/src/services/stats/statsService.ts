import { getHomeOverviewFromApi } from '@/src/api/homeApi';
import {
  getDailyPracticeStatsFromApi,
  getRecentPracticeSessionsFromApi,
  getSubjectProgressStatsFromApi,
  getTopicProgressStatsFromApi,
} from '@/src/api/statsApi';
import { ttlCache } from '@/src/cache/ttlCache';
import { isBackendApiEnabled } from '@/src/config/runtime';
import {
  getDailyPracticeStats as getDailyPracticeStatsFromDb,
  getHomeOverview as getHomeOverviewFromDb,
  getRecentPracticeSessions as getRecentPracticeSessionsFromDb,
  getRecentSevenDayStats,
  getSubjectProgressStats as getSubjectProgressStatsFromDb,
  getTopicProgressStats as getTopicProgressStatsFromDb,
} from '@/src/db/repositories/statsRepository';
import type { HomeOverview, StatsSummary } from '@/src/types/domain';

const STATS_CACHE_TTL = 30_000;

export async function getHomeOverview() {
  if (isBackendApiEnabled()) {
    return getHomeOverviewFromApi();
  }

  return getHomeOverviewFromDb();
}

export async function getDailyPracticeStats(startDateKey: string, endDateKey: string) {
  if (isBackendApiEnabled()) {
    return getDailyPracticeStatsFromApi(startDateKey, endDateKey);
  }

  return getDailyPracticeStatsFromDb(startDateKey, endDateKey);
}

export async function getStatsSummary(): Promise<StatsSummary> {
  const cached = ttlCache.get<StatsSummary>('stats:summary');

  if (cached) {
    return cached;
  }

  const [overview, recentSevenDays, subjectProgress, topicProgress, recentSessions] = isBackendApiEnabled()
    ? await Promise.all([
        getHomeOverviewFromApi(),
        getDailyPracticeStatsFromApi(getDateKeyOffset(-6), getDateKeyOffset(0)),
        getSubjectProgressStatsFromApi(),
        getTopicProgressStatsFromApi(),
        getRecentPracticeSessionsFromApi(),
      ])
    : await Promise.all([
        getHomeOverviewFromDb(),
        getRecentSevenDayStats(),
        getSubjectProgressStatsFromDb(),
        getTopicProgressStatsFromDb(),
        getRecentPracticeSessionsFromDb(),
      ]);

  const data: StatsSummary = {
    overview,
    recentSevenDays,
    subjectProgress,
    topicProgress,
    recentSessions,
  };

  ttlCache.set('stats:summary', data, STATS_CACHE_TTL);
  return data;
}

function getDateKeyOffset(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function getOverviewAccuracyRate(overview: HomeOverview) {
  if (overview.totalAnswers === 0) {
    return 0;
  }

  return Math.round((overview.correctAnswers / overview.totalAnswers) * 100);
}

export function getCoverageRate(overview: HomeOverview) {
  if (overview.questionCount === 0) {
    return 0;
  }

  return Math.round((overview.answeredUniqueQuestions / overview.questionCount) * 100);
}
