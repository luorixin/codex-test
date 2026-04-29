import { getDatabase } from '@/src/db/database';
import type { TopicDetail, TopicProgressSnapshot, TopicTreeSummary } from '@/src/types/domain';

export async function getTopicById(topicId: string): Promise<TopicDetail | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<TopicDetail>(
    `
      SELECT
        topic.id,
        topic.subjectId,
        topic.parentId,
        topic.name,
        topic.sortOrder,
        subject.name as subjectName
      FROM topic
      INNER JOIN subject ON subject.id = topic.subjectId
      WHERE topic.id = ?
    `,
    [topicId],
  );

  return row ?? null;
}

export async function listChildTopics(topicId: string): Promise<TopicTreeSummary[]> {
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
      WHERE parentId = ?
      ORDER BY sortOrder ASC, name ASC
    `,
    [topicId],
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

export async function getTopicProgressSnapshot(
  topicId: string,
): Promise<TopicProgressSnapshot | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<TopicProgressSnapshot>(
    `
      WITH RECURSIVE subtree(id) AS (
        SELECT id FROM topic WHERE id = ?
        UNION ALL
        SELECT topic.id
        FROM topic
        INNER JOIN subtree ON topic.parentId = subtree.id
      )
      SELECT
        (SELECT COUNT(*) FROM topic WHERE parentId = ?) as childTopicCount,
        (SELECT COUNT(*) FROM question WHERE topicId IN (SELECT id FROM subtree)) as questionCount,
        (SELECT COUNT(*) FROM user_answer WHERE questionId IN (SELECT id FROM question WHERE topicId IN (SELECT id FROM subtree))) as answeredCount,
        (
          SELECT COUNT(*)
          FROM wrong_book_item
          WHERE wrong_book_item.topicId IN (SELECT id FROM subtree) AND wrong_book_item.resolved = 0
        ) as wrongCount
    `,
    [topicId, topicId],
  );

  return row ?? null;
}
