import { getDatabase } from '@/src/db/database';
import { getTopicProgressSnapshot } from '@/src/db/repositories/topicRepository';
import type { SubjectDetail, SubjectSummary, TopicTreeSummary } from '@/src/types/domain';

export async function listSubjects(): Promise<SubjectSummary[]> {
  const db = await getDatabase();

  return db.getAllAsync<SubjectSummary>(
    `
      SELECT
        subject.id,
        subject.name,
        subject.sortOrder,
        COUNT(DISTINCT topic.id) as topicCount,
        COUNT(DISTINCT question.id) as questionCount
      FROM subject
      LEFT JOIN topic ON topic.subjectId = subject.id
      LEFT JOIN question ON question.subjectId = subject.id
      GROUP BY subject.id
      ORDER BY subject.sortOrder ASC, subject.name ASC
    `,
  );
}

export async function getSubjectById(subjectId: string): Promise<SubjectDetail | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    sortOrder: number;
    topicCount: number;
    rootTopicCount: number;
    questionCount: number;
  }>(
    `
      SELECT
        subject.id,
        subject.name,
        subject.sortOrder,
        COUNT(DISTINCT topic.id) as topicCount,
        COUNT(DISTINCT CASE WHEN topic.parentId IS NULL THEN topic.id END) as rootTopicCount,
        COUNT(DISTINCT question.id) as questionCount
      FROM subject
      LEFT JOIN topic ON topic.subjectId = subject.id
      LEFT JOIN question ON question.subjectId = subject.id
      WHERE subject.id = ?
      GROUP BY subject.id
    `,
    [subjectId],
  );

  if (!row) {
    return null;
  }

  return row;
}

export async function listRootTopicsBySubject(subjectId: string): Promise<TopicTreeSummary[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    subjectId: string;
    name: string;
    sortOrder: number;
  }>(
    `
      SELECT id, subjectId, name, sortOrder
      FROM topic
      WHERE subjectId = ? AND parentId IS NULL
      ORDER BY sortOrder ASC, name ASC
    `,
    [subjectId],
  );

  return Promise.all(
    rows.map(async (row) => {
      const snapshot = await getTopicProgressSnapshot(row.id);

      return {
        ...row,
        childTopicCount: snapshot?.childTopicCount ?? 0,
        questionCount: snapshot?.questionCount ?? 0,
      };
    }),
  );
}
