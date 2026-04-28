import { ttlCache } from '@/src/cache/ttlCache';
import {
  getDailyPracticeStats,
  getHomeOverview,
  getRecentPracticeSessions,
  getRecentSevenDayStats,
  getSubjectProgressStats,
  getTopicProgressStats,
} from '@/src/db/repositories/statsRepository';
import type { HomeOverview, StatsSummary } from '@/src/types/domain';

export { getHomeOverview };
export { getDailyPracticeStats };

const STATS_CACHE_TTL = 30_000;

export async function getStatsSummary(): Promise<StatsSummary> {
  const cached = ttlCache.get<StatsSummary>('stats:summary');

  if (cached) {
    return cached;
  }

  const [overview, recentSevenDays, subjectProgress, topicProgress, recentSessions] =
    await Promise.all([
      getHomeOverview(),
      getRecentSevenDayStats(),
      getSubjectProgressStats(),
      getTopicProgressStats(),
      getRecentPracticeSessions(),
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
