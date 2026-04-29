import { getDatabase } from '@/src/db/database';
import type {
  DailyPracticeStat,
  HomeOverview,
  PracticeSessionSummary,
  SubjectProgressStat,
  TopicProgressStat,
} from '@/src/types/domain';

export async function getHomeOverview(): Promise<HomeOverview> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<HomeOverview>(
    `
      SELECT
        (SELECT COUNT(*) FROM subject) as subjectCount,
        (SELECT COUNT(*) FROM topic) as topicCount,
        (SELECT COUNT(*) FROM question) as questionCount,
        (SELECT COUNT(*) FROM practice_session) as totalSessions,
        (SELECT COUNT(*) FROM practice_session WHERE finishedAt IS NOT NULL) as completedSessions,
        (SELECT COUNT(*) FROM user_answer) as totalAnswers,
        (SELECT COALESCE(SUM(isCorrect), 0) FROM user_answer) as correctAnswers,
        (SELECT COUNT(DISTINCT questionId) FROM user_answer) as answeredUniqueQuestions,
        (SELECT COUNT(*) FROM wrong_book_item WHERE resolved = 0) as unresolvedWrongCount,
        (
          SELECT COUNT(DISTINCT substr(answeredAt, 1, 10))
          FROM user_answer
          WHERE substr(answeredAt, 1, 10) >= ?
        ) as activeDaysLast7
    `,
    [getDateKeyOffset(-6)],
  );

  return row ?? getEmptyOverview();
}

export async function getRecentSevenDayStats(): Promise<DailyPracticeStat[]> {
  return getDailyPracticeStats(getDateKeyOffset(-6), getDateKeyOffset(0));
}

export async function getDailyPracticeStats(
  startDateKey: string,
  endDateKey: string,
): Promise<DailyPracticeStat[]> {
  const db = await getDatabase();
  const dateKeys = getDateKeyRange(startDateKey, endDateKey);

  if (dateKeys.length === 0) {
    return [];
  }

  const rows = await db.getAllAsync<{
    dateKey: string;
    answerCount: number;
    correctCount: number;
  }>(
    `
      SELECT
        substr(answeredAt, 1, 10) as dateKey,
        COUNT(*) as answerCount,
        COALESCE(SUM(isCorrect), 0) as correctCount
      FROM user_answer
      WHERE substr(answeredAt, 1, 10) BETWEEN ? AND ?
      GROUP BY substr(answeredAt, 1, 10)
      ORDER BY dateKey ASC
    `,
    [dateKeys[0], dateKeys[dateKeys.length - 1]],
  );

  const rowMap = new Map(rows.map((row) => [row.dateKey, row]));
  return dateKeys.map((dateKey) => {
    const row = rowMap.get(dateKey);

    return {
      dateKey,
      label: dateKey.slice(5).replace('-', '/'),
      answerCount: row?.answerCount ?? 0,
      correctCount: row?.correctCount ?? 0,
    };
  });
}

export async function getSubjectProgressStats(): Promise<SubjectProgressStat[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<SubjectProgressStat, 'completionRate' | 'accuracyRate'>>(
    `
      SELECT
        subject.id as subjectId,
        subject.name as subjectName,
        COUNT(DISTINCT question.id) as totalQuestions,
        COUNT(DISTINCT user_answer.questionId) as answeredQuestions,
        COUNT(user_answer.id) as answerCount,
        COALESCE(SUM(user_answer.isCorrect), 0) as correctCount,
        (
          SELECT COUNT(*)
          FROM wrong_book_item
          WHERE wrong_book_item.subjectId = subject.id AND wrong_book_item.resolved = 0
        ) as unresolvedWrongCount
      FROM subject
      LEFT JOIN question ON question.subjectId = subject.id
      LEFT JOIN user_answer ON user_answer.questionId = question.id
      GROUP BY subject.id
      ORDER BY subject.sortOrder ASC, subject.name ASC
    `,
  );

  return rows.map((row) => ({
    ...row,
    completionRate: calculateRate(row.answeredQuestions, row.totalQuestions),
    accuracyRate: calculateRate(row.correctCount, row.answerCount),
  }));
}

export async function getTopicProgressStats(): Promise<TopicProgressStat[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Omit<TopicProgressStat, 'completionRate' | 'accuracyRate'>>(
    `
      SELECT
        topic.id as topicId,
        topic.name as topicName,
        subject.id as subjectId,
        subject.name as subjectName,
        COUNT(DISTINCT question.id) as totalQuestions,
        COUNT(DISTINCT user_answer.questionId) as answeredQuestions,
        COUNT(user_answer.id) as answerCount,
        COALESCE(SUM(user_answer.isCorrect), 0) as correctCount
      FROM topic
      INNER JOIN subject ON subject.id = topic.subjectId
        INNER JOIN question ON question.topicId = topic.id
        LEFT JOIN user_answer ON user_answer.questionId = question.id
      GROUP BY topic.id
        ORDER BY topic.sortOrder ASC, topic.name ASC
    `,
  );

  return rows
    .map((row) => ({
      ...row,
      completionRate: calculateRate(row.answeredQuestions, row.totalQuestions),
      accuracyRate: calculateRate(row.correctCount, row.answerCount),
    }))
    .sort((left, right) => {
      if (left.completionRate !== right.completionRate) {
        return right.completionRate - left.completionRate;
      }

      if (left.accuracyRate !== right.accuracyRate) {
        return right.accuracyRate - left.accuracyRate;
      }

      return left.topicName.localeCompare(right.topicName, 'zh-Hans-CN');
    });
}

export async function getRecentPracticeSessions(limit = 5): Promise<PracticeSessionSummary[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<PracticeSessionSummary>(
    `
      SELECT
        practice_session.id,
        practice_session.mode,
        practice_session.topicId,
        practice_session.scopeTitle,
        subject.name as subjectName,
        practice_session.questionCount,
        practice_session.correctCount,
        practice_session.startedAt,
        practice_session.finishedAt
      FROM practice_session
      INNER JOIN subject ON subject.id = practice_session.subjectId
      ORDER BY COALESCE(practice_session.finishedAt, practice_session.startedAt) DESC
      LIMIT ?
    `,
    [limit],
  );

  return rows;
}

function calculateRate(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function getDateKeyOffset(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function getDateKeyRange(startDateKey: string, endDateKey: string) {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);

  if (!start || !end || start.getTime() > end.getTime()) {
    return [];
  }

  const dateKeys: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    dateKeys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateKeys;
}

function parseDateKey(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const date = new Date(`${dateKey}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getEmptyOverview(): HomeOverview {
  return {
    subjectCount: 0,
    topicCount: 0,
    questionCount: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    answeredUniqueQuestions: 0,
    unresolvedWrongCount: 0,
    activeDaysLast7: 0,
  };
}
