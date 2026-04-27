import { getDatabase } from '@/src/db/database';
import type {
  CatalogSnapshotDto,
  PracticeQuestion,
  PracticeQuestionOption,
  SubjectDetail,
  SubjectSummary,
  TopicDetail,
  TopicTreeSummary,
} from '@/src/types/domain';

type PracticeQuestionRow = {
  id: string;
  topicId: string;
  topicName: string;
  type: PracticeQuestion['type'];
  stem: string;
  explanation: string;
};

type PracticeOptionRow = {
  id: string;
  questionId: string;
  key: string;
  content: string;
  isCorrect: number;
};

export async function saveCatalogSnapshot(snapshot: CatalogSnapshotDto) {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM question_option;
      DELETE FROM question;
      DELETE FROM topic;
      DELETE FROM subject;
    `);

    for (const subject of snapshot.subjects) {
      await db.runAsync(
        'INSERT INTO subject (id, name, sortOrder) VALUES (?, ?, ?)',
        [subject.id, subject.name, subject.sortOrder],
      );
    }

    for (const topic of snapshot.topics) {
      await db.runAsync(
        'INSERT INTO topic (id, subjectId, parentId, name, sortOrder) VALUES (?, ?, ?, ?, ?)',
        [topic.id, topic.subjectId, topic.parentId ?? null, topic.name, topic.sortOrder],
      );
    }

    for (const question of snapshot.questions) {
      await db.runAsync(
        `
          INSERT INTO question
            (id, subjectId, topicId, type, stem, explanation, difficulty, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          question.id,
          question.subjectId,
          question.topicId,
          question.type,
          question.stem,
          question.explanation,
          question.difficulty ?? null,
          question.source ?? null,
        ],
      );
    }

    for (const option of snapshot.options) {
      await db.runAsync(
        'INSERT INTO question_option (id, questionId, key, content, isCorrect) VALUES (?, ?, ?, ?, ?)',
        [option.id, option.questionId, option.key, option.content, option.isCorrect ? 1 : 0],
      );
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
      ['catalogLastSyncAt', new Date().toISOString()],
    );
  });
}

export async function getSubjectsFromCache(): Promise<SubjectSummary[]> {
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

export async function getSubjectFromCache(subjectId: string): Promise<SubjectDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SubjectDetail>(
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

  return row ?? null;
}

export async function getTopicsBySubjectFromCache(subjectId: string): Promise<TopicTreeSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    subjectId: string;
    name: string;
    sortOrder: number;
  }>(
    `
      SELECT
        topic.id,
        topic.subjectId,
        topic.name,
        topic.sortOrder
      FROM topic
      WHERE topic.subjectId = ? AND topic.parentId IS NULL
      ORDER BY topic.sortOrder ASC, topic.name ASC
    `,
    [subjectId],
  );

  return Promise.all(rows.map((row) => buildTopicTreeSummary(db, row)));
}

export async function getChildTopicsFromCache(topicId: string): Promise<TopicTreeSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    subjectId: string;
    name: string;
    sortOrder: number;
  }>(
    `
      SELECT
        topic.id,
        topic.subjectId,
        topic.name,
        topic.sortOrder
      FROM topic
      WHERE topic.parentId = ?
      ORDER BY topic.sortOrder ASC, topic.name ASC
    `,
    [topicId],
  );

  return Promise.all(rows.map((row) => buildTopicTreeSummary(db, row)));
}

export async function getTopicDetailFromCache(topicId: string): Promise<TopicDetail | null> {
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

export async function getQuestionsByTopicFromCache(
  topicId: string,
  includeDescendants = true,
): Promise<PracticeQuestion[]> {
  const db = await getDatabase();

  const questionRows = await db.getAllAsync<PracticeQuestionRow>(
    includeDescendants
      ? `
        WITH RECURSIVE subtree(id) AS (
          SELECT id FROM topic WHERE id = ?
          UNION ALL
          SELECT topic.id
          FROM topic
          INNER JOIN subtree ON topic.parentId = subtree.id
        )
        SELECT
          question.id,
          question.topicId,
          topic.name as topicName,
          question.type,
          question.stem,
          question.explanation
        FROM question
        INNER JOIN topic ON topic.id = question.topicId
        WHERE question.topicId IN (SELECT id FROM subtree)
        ORDER BY topic.sortOrder ASC, question.id ASC
      `
      : `
        SELECT
          question.id,
          question.topicId,
          topic.name as topicName,
          question.type,
          question.stem,
          question.explanation
        FROM question
        INNER JOIN topic ON topic.id = question.topicId
        WHERE question.topicId = ?
        ORDER BY topic.sortOrder ASC, question.id ASC
      `,
    [topicId],
  );

  return hydratePracticeQuestions(questionRows);
}

export async function getQuestionsByIdsFromCache(questionIds: string[]): Promise<PracticeQuestion[]> {
  if (questionIds.length === 0) {
    return [];
  }

  const db = await getDatabase();
  const placeholders = questionIds.map(() => '?').join(', ');
  const questionRows = await db.getAllAsync<PracticeQuestionRow>(
    `
      SELECT
        question.id,
        question.topicId,
        topic.name as topicName,
        question.type,
        question.stem,
        question.explanation
      FROM question
      INNER JOIN topic ON topic.id = question.topicId
      WHERE question.id IN (${placeholders})
    `,
    questionIds,
  );

  const orderMap = new Map(questionIds.map((id, index) => [id, index]));
  const hydrated = await hydratePracticeQuestions(questionRows);
  return hydrated.sort((left, right) => (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0));
}

async function hydratePracticeQuestions(questionRows: PracticeQuestionRow[]) {
  if (questionRows.length === 0) {
    return [];
  }

  const db = await getDatabase();
  const questionIds = questionRows.map((row) => row.id);
  const placeholders = questionIds.map(() => '?').join(', ');
  const optionRows = await db.getAllAsync<PracticeOptionRow>(
    `
      SELECT
        question_option.id,
        question_option.questionId,
        question_option.key,
        question_option.content,
        question_option.isCorrect
      FROM question_option
      WHERE question_option.questionId IN (${placeholders})
      ORDER BY question_option.questionId ASC, question_option.key ASC
    `,
    questionIds,
  );

  const optionMap = new Map<string, PracticeQuestionOption[]>();
  for (const row of optionRows) {
    const options = optionMap.get(row.questionId) ?? [];
    options.push({
      id: row.id,
      key: row.key,
      content: row.content,
      isCorrect: row.isCorrect === 1,
    });
    optionMap.set(row.questionId, options);
  }

  return questionRows.map((row) => ({
    ...row,
    options: optionMap.get(row.id) ?? [],
  }));
}

async function buildTopicTreeSummary(
  db: Awaited<ReturnType<typeof getDatabase>>,
  row: Pick<TopicTreeSummary, 'id' | 'subjectId' | 'name' | 'sortOrder'>,
): Promise<TopicTreeSummary> {
  const snapshot = await db.getFirstAsync<{
    childTopicCount: number;
    questionCount: number;
  }>(
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
        (SELECT COUNT(*) FROM question WHERE topicId IN (SELECT id FROM subtree)) as questionCount
    `,
    [row.id, row.id],
  );

  return {
    ...row,
    childTopicCount: snapshot?.childTopicCount ?? 0,
    questionCount: snapshot?.questionCount ?? 0,
  };
}
